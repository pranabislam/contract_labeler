import json
import pandas as pd
import numpy as np
import ast
import math
from collections import Counter
import re
import os
import sys
import post_process_helper
import postprocessor_tests


def main():

    # contract_num = 29
    # path_to_contracts = "/Users/rohith/Documents/Independent Study - DSGA1006/contracts/"
    contract_num = sys.argv[1]
    path_to_contracts = sys.argv[2]

    all_nodes_df, exploded_highlight_df = get_highlight_full_dataframes(f'{path_to_contracts}labeled/', contract_num)
    
    filtered_highlight_df = filter_highlight_nodes_non_trivial(exploded_highlight_df, contract_num, path_to_contracts)
    
    # Replace new lines with spaces
    filtered_highlight_df['highlighted_segmented_text'] = (
        filtered_highlight_df.highlighted_segmented_text.str.replace('\n', ' ')
    )
    all_nodes_df['text'] = all_nodes_df.text.str.replace('\n', ' ')
    

    obj_cols = [
        'highlighted_xpaths',
        'highlighted_segmented_text',
        'highlighted_labels',
        'segment_number_from_idx',
        'highlighted_coordinates'
    ]

    all_nodes_copy = all_nodes_df.copy(deep=True)

    for col in exploded_highlight_df.columns:
        all_nodes_copy[col] = np.nan
        if col in obj_cols:
            all_nodes_copy[col] = all_nodes_copy[col].astype(object)

    merge(all_nodes_copy, filtered_highlight_df)
    postprocessor_tests.test_merge(all_nodes_copy, filtered_highlight_df, all_nodes_copy)
    merged_tagged = tag_bies_for_highlights(all_nodes_copy)
    
    if 'period_space_section_title' in merged_tagged.columns:
        merged_tagged.drop(columns=['period_space_section_title'], inplace=True)
    if 'is_section_title' in merged_tagged.columns:
        merged_tagged.drop(columns=['is_section_title'], inplace=True)
    
    merged_tagged.to_csv(f'{path_to_contracts}tagged/contract_{contract_num}_tagged.csv')


def remove_section_titles_that_start_with_period_and_space(df):
    '''
    Let's also remove lines that are only a period too.
    '''
    df['period_space_section_title'] = (
        df['highlighted_segmented_text'].str.match('\. [.]*|\.\t[.]*|\.\u00A0[.]*|\.$')
    )
    
    df['is_section_title'] = df['highlighted_labels'].apply(
        lambda x: 1 if 'st' in x else 0
    )
    
    rows_to_remove = df[df['period_space_section_title'] == True].copy(deep=True)

    if len(rows_to_remove[rows_to_remove['is_section_title'] == 0]) > 0:
        print('Warning, there were some rows that had the period space start but were not section titles. Please investigate. We are only removing rows that are section titles though')    
        print(rows_to_remove[rows_to_remove['is_section_title']])

    df = df[df['period_space_section_title'] == False].copy(deep=True)
    df = df.drop(columns=['period_space_section_title', 'is_section_title'])

    return df.reset_index(drop=True), rows_to_remove

def filter_highlight_nodes_non_trivial(df, contract_num, path_to_contracts):
    '''
    After running highlight node df through simple filtering of clearly incorrect rows,
    we now filter on rows that are more nuanced and stem from labeler errors we observed
    from inspecting contracts
    '''
    df, rows_dropped1 = remove_section_titles_that_start_with_period_and_space(df)
    df, rows_dropped2 = remove_highlighted_duplicates(df)

    ## output csv for rows dropped
    removed_rows = pd.concat([rows_dropped1, rows_dropped2])
    removed_rows.to_csv(f'{path_to_contracts}removed_rows/contract_{contract_num}_removed_rows.csv')

    return df

def get_highlight_full_dataframes(path_to_contracts, contract_num):
    
    all_nodes_path = f"{path_to_contracts}contract_{contract_num}_all_nodes.json"
    highlighted_nodes_path = f"{path_to_contracts}contract_{contract_num}_highlighted.json"
    highlight_nodes_edits_path = f"{path_to_contracts}edits/contract_{contract_num}_highlighted.json"


    with open(all_nodes_path, encoding='UTF-8') as f:
        all_nodes_data = json.load(f)
    with open(highlighted_nodes_path, encoding='UTF-8') as f:
        highlighted_data = json.load(f)
    highlighted_data_edits = None
    if os.path.exists(highlight_nodes_edits_path):
        with open(highlight_nodes_edits_path, encoding='UTF-8') as f:
            highlighted_data_edits = json.load(f)

    all_nodes_df = post_process_helper.create_all_nodes_df(all_nodes_data)
    postprocessor_tests.test_filter_all_nodes_df(all_nodes_df)
    exploded_highlight_df = post_process_helper.create_highlight_nodes_df(highlighted_data)
    postprocessor_tests.test_filter_highlight_nodes_df(exploded_highlight_df)

    if os.path.exists(highlight_nodes_edits_path):
        highlight_edits = post_process_helper.create_highlight_nodes_df(highlighted_data_edits)

    all_nodes_df.to_csv(f'{path_to_contracts}csvs/contract_{contract_num}_all_nodes.csv')
    exploded_highlight_df.to_csv(f'{path_to_contracts}csvs/contract_{contract_num}_highlighted.csv')
    if os.path.exists(highlight_nodes_edits_path):
        highlight_edits.to_csv(f'{path_to_contracts}csvs/contract_{contract_num}_edited.csv')

    return all_nodes_df, exploded_highlight_df



def fill_row(all_nodes, highlight_df, all_idx, highlight_idx):
    for col in highlight_df.columns:
        all_nodes.at[all_idx, col] = highlight_df.at[highlight_idx, col]
    return None

def remove_highlighted_duplicates(df):
    highlight_df = df.reset_index().drop(columns=['index'])
    drop_index = []
    for i, cur in highlight_df.iterrows():
        if i == 0:
            continue
            
        prev = highlight_df.iloc[i-1]
        
        if len(cur.highlighted_segmented_text) < 1:
            drop_index.append(i)
        
        if prev.highlighted_segmented_text.startswith(cur.highlighted_segmented_text)\
        and prev.highlighted_xpaths == cur.highlighted_xpaths\
        and 'st' in cur.highlighted_labels:
            drop_index.append(i)

    #print(drop_index)

    dropped_rows = highlight_df.iloc[drop_index].copy(deep=True)
    
    highlight_df.drop(drop_index, inplace=True)
    highlight_df.drop(columns='size', inplace=True)
    
    final_group_sizes = highlight_df.groupby('segment_number_from_idx', as_index=False).size()
    highlight_df = pd.merge(highlight_df, final_group_sizes, on='segment_number_from_idx', how='left')
    
    highlight_df = highlight_df.reset_index(drop=True)
    new_highlight_index = highlight_df.index
    highlight_df['exploded_highlight_node_order'] = new_highlight_index
    
    return highlight_df, dropped_rows

def merge(all_nodes_df, highlight_nodes_df):
    '''
    Curr status: I think this function simply stops when theres a lack of a match based on two pointers
    '''
    curr_highlight_node_idx = 0
    
    for i, row in all_nodes_df.iterrows():
        xpath_match = (
            row.xpaths == highlight_nodes_df.at[
            curr_highlight_node_idx,
            'highlighted_xpaths'
        ])
        # if curr_highlight_node_idx in range(283, 285):
        #     print(row.text, xpath_match, row.xpaths, highlight_nodes_df.at[
        #     curr_highlight_node_idx,
        #     'highlighted_xpaths'
        # ])
        #text_subset = highlight_nodes_df.at[
        #    curr_highlight_node_idx,
        #    'highlighted_segmented_text'
        #] == row.text
        
        text_subset = True
        if xpath_match and text_subset:
            fill_row(
                all_nodes=all_nodes_df,
                highlight_df=highlight_nodes_df, 
                all_idx=i,
                highlight_idx=curr_highlight_node_idx
            )
            curr_highlight_node_idx += 1
        # print(curr_highlight_node_idx)
        if curr_highlight_node_idx >= len(highlight_nodes_df):
            return
        
def tag_bies_for_highlights(merged: pd.DataFrame) -> pd.DataFrame:
    
    tags = []
    count = 1
    for i, row in merged.iterrows():
        if not len(merged['highlighted_segmented_text']) > 0:
            continue
        
        list_entry_count = row['size']
        
        try:
            next_entry_count = merged.iloc[i+1]['size']
            # print(type(next_entry_count))
            if np.isnan(next_entry_count):
                next_entry_count = list_entry_count
        except:
            next_entry_count = 0
        # Non highlighted row
        if math.isnan(list_entry_count):
            tags.append('o')    
        
        # Single highlighted node
        elif list_entry_count == 1:
            tags.append(f's_{row.highlighted_labels}')
            count = 1
        
        # Last entry in group greater than size 1
        elif count == list_entry_count:          
        # elif list_entry_count > 1 and next_entry_count != list_entry_count:
            # print(count, list_entry_count, next_entry_count)
            tags.append(f'e_{row.highlighted_labels}')
            count = 1
        elif (count < list_entry_count) and count == 1:
            tags.append(f'b_{row.highlighted_labels}')
            count += 1
        elif (count < list_entry_count) and count > 1:
            tags.append(f'i_{row.highlighted_labels}')
            count += 1
    # print(count, list_entry_count, next_entry_count)
    merged['tagged_sequence'] = tags
    return merged



if __name__ == '__main__':
    main()