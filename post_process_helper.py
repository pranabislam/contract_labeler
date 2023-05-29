import json
import pandas as pd
import numpy as np
import ast
import math
from collections import Counter
import re
import os


def filter_all_nodes_df(df, xpaths_col):
    
    original_length = len(df)
    df = df[
        ~(df[xpaths_col].str.contains('/script')) & 
        ~(df[xpaths_col].str.contains('/noscript'))
    ]
    
    if original_length - len(df) > 0:
        print(f'{original_length - len(df)} rows that had /script or /noscript were removed')
    
    new_length = len(df)
    df = df[df[xpaths_col] != '']
    
    if new_length - len(df) > 0:
        print(f'{new_length - len(df)} rows with empty strings were removed')
    
    return df.reset_index(drop=True)

def filter_highlight_nodes_df(df):
    
    print('Filtering highlight nodes df now')
    # We can apply this to highlight nodes without issue. In theory we should see 0 print statements so this 
    # can be a guardrail against unknown bugs
    df = filter_all_nodes_df(df, 'highlighted_xpaths')
    
    original_length = len(df)
    df = df[
        (df['highlighted_xpaths'] != 'DELETED') &
        (df['highlighted_coordinates'] != 'DEL')
    ]
    
    if original_length - len(df) > 0:
        print(f'{original_length - len(df)} rows with DEL, DELETED were removed')
    
    new_length = len(df)
    df = df.dropna()
    
    if new_length - len(df) > 0:
        print(f'{new_length - len(df)} NA rows were dropped. THIS IS A PROBLEM.')

    return df.reset_index(drop=True)


def remove_periods(row):
    # try:
    nrow = row
    xpaths = row['highlighted_xpaths']
    texts = row['highlighted_segmented_text']
    label = row['highlighted_labels']
    indices_to_remove = []
    if 'st' not in label:
        return row
    for i, text in enumerate(texts):
        pattern = r'^(\. [^\n]+|\.|\.[ \t])'
        # if '.' == text or '. ' == text or ('. ' in text and len(text) == 3):
        matches = re.findall(pattern, text)
        if len(matches) > 0:
            print(matches)
            indices_to_remove.append(i)
    
    texts = [text for i, text in enumerate(texts) if i not in indices_to_remove]
    xpaths = [xpath for i, xpath in enumerate(xpaths) if i not in indices_to_remove]
    
    nrow['highlighted_xpaths'] = xpaths
    nrow['highlighted_segmented_text'] = texts
    return nrow


def same_line_via_IOU(ymin1, ymax1, ymin2, ymax2, threshold):
    '''
    Determine whether or not different lines are in fact the same 
    '''
    
    less_ymax = min(ymax1, ymax2)
    less_ymin = min(ymin1, ymin2)
    greater_ymax = max(ymax1, ymax2)
    greater_ymin = max(ymin1, ymin2)
    
    intersection = less_ymax - greater_ymin
    
    # no overlap
    if intersection < 0:
        return False
    
    union = greater_ymax - less_ymin
    
    if intersection / union > threshold:
        return True
    return False

class groupedLine:
    '''
    Call when you determine lines have some substantial IOU and group them as such
    '''
    def __init__(self):
        self.group = set()
        self.min_top = float('inf')
        self.max_bottom = float('-inf')
        self.map_retrieved = False
    
    def add_line(self, row_num, top_coor):
        self.group.add(row_num)
        self.min_top = min(top_coor, self.min_top)
    
    def construct_min_tops(self):
        self.min_top_map = {member:self.min_top for member in self.group}
        self.map_retrieved = True
        return self.min_top_map


def get_line_groupings(df, threshold):

    row_to_group = {}
    if len(df) == 1:
        return {0: df.at[0, 'top']}
    ## Can optimize by not iterating through entire list and stopping after IOU is 0 or line is much lower than prev
    for i in range(len(df)):
        for j in range(i + 1, len(df)):

            ## let's assume the df has a proper index
            idx1 = i
            idx2 = j

            top1 = df.at[i, 'top']
            top2 = df.at[j, 'top']

            bottom1 = top1 + df.at[i, 'height']
            bottom2 = top2 + df.at[j, 'height']

            #print(top1, top2, bottom1, bottom2)

            if same_line_via_IOU(
                ymin1=top1, 
                ymax1=bottom1, 
                ymin2=top2, 
                ymax2=bottom2, 
                threshold=threshold
            ):
                if idx1 in row_to_group or idx2 in row_to_group:
                    grouping = row_to_group.get(idx1, row_to_group.get(idx2))

                else:
                    grouping = groupedLine()

                grouping.add_line(idx1, top1)
                grouping.add_line(idx2, top2)

                row_to_group[idx1] = grouping
                row_to_group[idx2] = grouping
            else:
                if idx1 in row_to_group:
                    grouping1 = row_to_group[idx1]     
                else:
                    grouping1 = groupedLine()

                if idx2 in row_to_group:
                    grouping2 = row_to_group[idx2]    
                else:
                    grouping2 = groupedLine()

                grouping1.add_line(idx1, top1)
                grouping2.add_line(idx2, top2)

                row_to_group[idx1] = grouping1
                row_to_group[idx2] = grouping2
    
    final_group_map = {}

    for idx, grouping in row_to_group.items():
        if not grouping.map_retrieved:
            min_tops = grouping.construct_min_tops()
            final_group_map.update(min_tops)

    return final_group_map

def sort_exploded_highlight_box_by_coordinates(df, top_coor_col):
    '''
    If logic ever has to deal with approximations and some line inference (with IOU math),
    then this function will become more complicated but for now it seems okay

    df = exploded_highlight_df
    '''
    return df.sort_values(by=[top_coor_col,'left','exploded_highlight_node_order']).reset_index(drop=True)

def create_all_nodes_df(all_nodes_data):
    all_nodes_xpaths = ast.literal_eval(all_nodes_data['xpaths'])
    all_nodes_segmented_text = ast.literal_eval(all_nodes_data['segmentedTexts'])
    df = pd.DataFrame()
    df['xpaths'] = all_nodes_xpaths
    df['text'] = all_nodes_segmented_text
    
    # Filter
    df = filter_all_nodes_df(df, 'xpaths')
    df['all_nodes_ordering'] = df.index.copy()
    
    return df

def create_highlight_nodes_df(highlighted_data):
    
    # Step 1: read in the data and do basic checks:
    #highlight_text = ast.literal_eval(highlighted_data['texts'])
    highlighted_df = pd.DataFrame()
    highlighted_df['highlighted_xpaths'] = ast.literal_eval(highlighted_data['xpaths'])
    highlighted_df['highlighted_segmented_text'] = ast.literal_eval(highlighted_data['segmentedTexts'])
    highlighted_df['highlighted_labels'] = ast.literal_eval(highlighted_data['labels'])
    highlighted_df['highlighted_coordinates'] = ast.literal_eval(highlighted_data['c'])
    highlighted_df['segment_number_from_idx'] = highlighted_df.index.copy()
    
    highlighted_df = highlighted_df.apply(lambda row: remove_periods(row), axis=1)
    highlighted_df['num_entries_1'] = highlighted_df['highlighted_xpaths'].apply(len)
    highlighted_df['num_entries_2'] = highlighted_df['highlighted_segmented_text'].apply(len)
    
    assert highlighted_df['num_entries_1'].equals(highlighted_df['num_entries_2']), 'Mismatch in segmentation and groupings'
    print("There is no mismatch in segmentations and groupings, we can proceed")
        
    
    # Step 2: explode
    exploded_highlight_df = highlighted_df[
    ['highlighted_xpaths',
     'highlighted_segmented_text',
     'highlighted_labels',
     'segment_number_from_idx',
     'highlighted_coordinates',
     'num_entries_1']
    ].explode(column=['highlighted_xpaths','highlighted_segmented_text']).reset_index(drop=True)

    exploded_highlight_df['exploded_highlight_node_order'] = exploded_highlight_df.index.copy()
    
    # Step 3: Filter and extract coordinates
    exploded_highlight_df = filter_highlight_nodes_df(exploded_highlight_df)
    exploded_highlight_df['exploded_highlight_node_order'] = exploded_highlight_df.index.copy()
    
    exploded_highlight_df['top'] = exploded_highlight_df['highlighted_coordinates'].apply(lambda x: float(x[0]))
    exploded_highlight_df['left'] = exploded_highlight_df['highlighted_coordinates'].apply(lambda x: float(x[1]))
    exploded_highlight_df['width'] = exploded_highlight_df['highlighted_coordinates'].apply(lambda x: float(x[2]))
    exploded_highlight_df['height'] = exploded_highlight_df['highlighted_coordinates'].apply(lambda x: float(x[3]))
    #print("=======================================")
    #print(exploded_highlight_df.cols)
    #print("=======================================")
    # Step 4: Sort
    recalculated_top_coor_col = 'top_via_line_group'
    final_group_map = get_line_groupings(exploded_highlight_df, threshold=0.15)
    # print('+++++++++++++++++++++')
    # print(final_group_map)
    # print('+++++++++++++++++++++')

    exploded_highlight_df[recalculated_top_coor_col] = (
        exploded_highlight_df.exploded_highlight_node_order.apply(lambda x: final_group_map[x])
    )
    
    exploded_highlight_df = sort_exploded_highlight_box_by_coordinates(exploded_highlight_df, recalculated_top_coor_col)
    exploded_highlight_df['exploded_highlight_node_order'] = exploded_highlight_df.index.copy()
    
    # Get final group dizes post filtering
    final_group_sizes = exploded_highlight_df.groupby('segment_number_from_idx', as_index=False).size()
    
    # Do a left merge though almost certainly inner merge would work
    exploded_highlight_df = pd.merge(exploded_highlight_df, final_group_sizes, on='segment_number_from_idx', how='left')
    
    return exploded_highlight_df

def remove_rows_and_add_edits(exploded_highlight_df, remove_indices, highlight_edits):
    
    edited = pd.concat([
        exploded_highlight_df.drop(remove_indices),
        highlight_edits
    ])
    
    edited = sort_exploded_highlight_box_by_coordinates(edited)
    edited['exploded_highlight_node_order'] = edited.index.copy()
    
    return edited


