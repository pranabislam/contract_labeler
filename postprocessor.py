import json
import pandas as pd
import numpy as np
import ast
import math
from collections import Counter
import re
import argparse
import glob
import os
import sys
import post_process_helper
import postprocessor_tests
from collections import Counter

'''
Usage:
- if running on entire dir of tagged contracts
 `$ python3 postprocessor.py --contract_dir contract_dir`
 `$ python3 postprocessor.py --contract_dir ../labeling/contracts/`

- if running on a single contract
 `$ python3 postprocessor.py --contract_dir contract_dir --contract_num contract_num`
 `$ python3 postprocessor.py --contract_dir ../labeling/contracts/ --contract_num 1`

- if running on a single contract and loading contract after a manual edit
 `$ python3 postprocessor.py --contract_dir contract_dir --contract_num contract_num --is_edit_mode`
 `$ python3 postprocessor.py --contract_dir ../labeling/contracts/ --contract_num 1 --is_edit_mode
'''


def main(contract_num, path_to_contracts, is_edit_mode):

    # contract_num = 29
    # path_to_contracts = "/Users/rohith/Documents/Independent Study - DSGA1006/contracts/"
    # contract_num = sys.argv[1]
    # path_to_contracts = sys.argv[2]

    all_nodes_df, exploded_highlight_df = \
        get_highlight_full_dataframes(
            os.path.join(path_to_contracts,
            "labeled"),
            contract_num
        )

    filtered_highlight_df = \
        filter_highlight_nodes_non_trivial(
            exploded_highlight_df,
            contract_num,
            path_to_contracts,
        )

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

    highlight_edit_path = f'{contract_dir}drafts/contract_{contract_num}_highlight.csv'
    merged_edit_path = f'{contract_dir}drafts/contract_{contract_num}_merged.csv'

    if is_edit_mode:
        
        print('In edit mode, reading and filtering again')
        assert os.path.exists(highlight_edit_path), 'no editing file found in staging area'
        
        # Read the manually edited file, re filter and proceed
        filtered_highlight_df_copy = pd.read_csv(highlight_edit_path)
        filtered_highlight_df = filter_highlight_nodes_non_trivial(
            filtered_highlight_df_copy,
            contract_num,
            path_to_contracts,
        )

    merge(all_nodes_copy, filtered_highlight_df)

    ## Store for inspection before running tests and after merging (which is the main source of error)
    all_nodes_copy.to_csv(merged_edit_path, index=False)
    filtered_highlight_df.to_csv(highlight_edit_path, index=False)

    postprocessor_tests.test_merge(all_nodes_copy, filtered_highlight_df, all_nodes_copy)
    merged_tagged = tag_bies_for_highlights(all_nodes_copy)

    if 'period_space_section_title' in merged_tagged.columns:
        merged_tagged.drop(columns=['period_space_section_title'], inplace=True)
    if 'is_section_title' in merged_tagged.columns:
        merged_tagged.drop(columns=['is_section_title'], inplace=True)

    tagged_csv_savepath = os.path.join(path_to_contracts,
                                       "tagged",
                                       f"contract_{contract_num}_tagged.csv")
    if not os.path.exists(os.path.dirname(tagged_csv_savepath)):
        os.makedirs(os.path.dirname(tagged_csv_savepath))

    ## Let's now re save if the merged test is passed so we can edit before the bies test
    merged_tagged.to_csv(merged_edit_path, index=False)
    filtered_highlight_df.to_csv(highlight_edit_path, index=False)
    # merged_tagged.to_csv(tagged_csv_savepath, index=True)
    
    #####
    ##### OKAY I BELIEVE I SPOTTED THE PROBLEM:
    ##### BIES TAG ORDER IS VIOLATED WHEN I REMOVE THE TWO ROWS IN THE TITLE SECTIONFROM HIGHLIGHT NODES BUT 
    ##### DONT REMOVE THEM FROM ALL NODES. I CAN DO TWO THINGS:
    ##### DO NOT REMOVE THEM FROM HIGHLIGHT NODES
    ##### ADD READ MERGED EDITS HERE HERE TO READ BACK IN THE DATAFRAME EDITED
    
    if is_edit_mode:
        
        print('In edit mode, reading and filtering second round')
        assert os.path.exists(highlight_edit_path), 'no highlight editing file found in staging area'
        assert os.path.exists(merged_edit_path), 'no merged editing file found in staging area'
        
        # Read the manually edited file, re filter and proceed
        filtered_highlight_df_copy = pd.read_csv(highlight_edit_path)
        filtered_highlight_df = filter_highlight_nodes_non_trivial(
            filtered_highlight_df_copy,
            contract_num,
            path_to_contracts,
        )
        merged_tagged = pd.read_csv(merged_edit_path)
    
    ### THINK ABOUT WHETHER OR NOT THIS SOLUTION MAKES SENSE 
    ### MAYBE WE WANT TO EDIT THE REMOVE ROWS TO ONLY REMOVE ST!
    
    postprocessor_tests.test_tag_bies_for_highlights(merged_tagged,
                                                     filtered_highlight_df)
    merged_tagged.to_csv(tagged_csv_savepath, index=True)


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

    # Remove rows that have the period and are section titles.
    # Some nodes can be periods but dont suffer from this section title specific problem
    rows_to_remove = df[
        (df['period_space_section_title'] == True) &
        (df['is_section_title'] == 1)
    ].copy(deep=True)

    print("+" * 50)
    print(f'We are removing {len(rows_to_remove)} rows that are section titles that start with period')
    print("+" * 50)
    # if len(rows_to_remove[rows_to_remove['is_section_title'] == 0]) > 0:
    #     print('Warning, there were some rows that had the period space start but were not section titles. Please investigate. We are removing these rows')
    #     print(rows_to_remove[rows_to_remove['is_section_title'] == 0])

    df = df.drop(rows_to_remove.index)
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

    removed_rows_savepath = os.path.join(path_to_contracts,
                                     "removed_rows",
                                     f"contract_{contract_num}_removed_rows.csv")
    # dir doesnt exist, so create it
    if not os.path.exists(os.path.dirname(removed_rows_savepath)):
        os.makedirs(os.path.dirname(removed_rows_savepath))
    
    # if file is already there, lets save the new removed rows file to disk
    if os.path.exists(removed_rows_savepath):
        count = len(os.listdir(os.path.dirname(removed_rows_savepath)))
        removed_rows_savepath = f"{removed_rows_savepath[:-4]}_v{count}.csv"
    
    removed_rows.to_csv(removed_rows_savepath, index=True)

    return df


def get_highlight_full_dataframes(path_to_contracts, contract_num):

    all_nodes_path = os.path.join(
        path_to_contracts,
        f"contract_{contract_num}_all_nodes.json"
    )
    highlighted_nodes_path = os.path.join(
        path_to_contracts,
        f"contract_{contract_num}_highlighted.json"
    )
    highlight_nodes_edits_path = os.path.join(
        path_to_contracts,
        "edits",
        f"contract_{contract_num}_highlighted.json"
    )
    if not os.path.exists(os.path.dirname(highlight_nodes_edits_path)):
        os.makedirs(os.path.dirname(highlight_nodes_edits_path))

    with open(all_nodes_path, encoding='UTF-8') as f:
        all_nodes_data = json.load(f)

    with open(highlighted_nodes_path, encoding='UTF-8') as f:
        highlighted_data = json.load(f)

    all_nodes_df = post_process_helper.create_all_nodes_df(all_nodes_data)
    postprocessor_tests.test_filter_all_nodes_df(all_nodes_df)
    
    ## If we are incorporating edits
    highlighted_data_edits = None
    if os.path.exists(highlight_nodes_edits_path):
        with open(highlight_nodes_edits_path, encoding='UTF-8') as f:
            highlighted_data_edits = json.load(f)
        exploded_highlight_df = post_process_helper.create_highlight_nodes_df(highlighted_data, True, highlighted_data_edits)
    else:
        exploded_highlight_df = post_process_helper.create_highlight_nodes_df(highlighted_data, False, highlighted_data_edits)
    
    postprocessor_tests.test_filter_highlight_nodes_df(exploded_highlight_df)

    # if os.path.exists(highlight_nodes_edits_path):
    #     highlight_edits = post_process_helper.create_highlight_nodes_df(highlighted_data_edits)

    if not os.path.exists(os.path.join(path_to_contracts, 'csvs')):
        os.makedirs(os.path.join(path_to_contracts, 'csvs'))

    all_nodes_df.to_csv(os.path.join(path_to_contracts,
                                     'csvs',
                                     f'contract_{contract_num}_all_nodes.csv'),
                        index=True)
    exploded_highlight_df.to_csv(os.path.join(path_to_contracts,
                                              'csvs',
                                              f'contract_{contract_num}_highlighted.csv'),
                                 index=True)
    # if os.path.exists(highlight_nodes_edits_path):
    #     highlight_edits.to_csv(os.path.join(path_to_contracts,
    #                                         'csvs',
    #                                         f'contract_{contract_num}_edited.csv'),
    #                            index=True)

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
    print(f"Dropping rows with index {drop_index} in remove highlight duplicates fx")
    dropped_rows = highlight_df.iloc[drop_index].copy(deep=True)

    highlight_df.drop(drop_index, inplace=True)
    
    ## drop size if size is in the columns (double check this)
    if 'size' in highlight_df.columns:
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
    parser = argparse.ArgumentParser()

    parser.add_argument('--contract_dir', type=str,
                        help='path to the dir that contains labeled contracts',
                        required=True)
    parser.add_argument('--contract_num', type=int,
                        help='''contract id of a single contract
                                use this for debugging or testing''',
                        default=None)

    parser.add_argument('--is_edit_mode',
                        help='''Enter --is_edit_mode if you would like to signify you
                            want to load a contract after manually editing
                            and saving to staging area
                         ''',
                        action="store_true")

    args = parser.parse_args()

    contract_dir = args.contract_dir
    is_edit_mode = args.is_edit_mode
    error_contract_container = []

    print("Processing...")
    # if the user passes a single contract num then skip
    # getting the list of contracts
    # if the contract is already present in the tagged dir, then skip it
    if args.contract_num is None:
        list_of_contracts = glob.glob(os.path.join(contract_dir,
                                                   "labeled",
                                                   '*.json'))
        list_of_contract_ids = [int(x.split("_", 2)[1]) for x in list_of_contracts]
        list_of_contract_ids = list(set(list_of_contract_ids))
        list_of_contract_ids.sort()

        print(f"found {len(list_of_contract_ids)} contracts!")

        for contract_num in list_of_contract_ids:
            print("*" * 50)
            print(f"Postprocessing contract {contract_num}")
            print("*" * 50)
            try:
                tagged_csv_savepath = os.path.join(contract_dir,
                                                "tagged",
                                                f"contract_{contract_num}_tagged.csv")
                if os.path.exists(tagged_csv_savepath):
                    print("*" * 50)
                    print(f"contract_{contract_num}_tagged.csv already exists. Skipping!")
                    print("*" * 50)
                    continue

                main(contract_num, contract_dir, is_edit_mode)

            except Exception as e:
                error_contract_container.append(contract_num)
                print(f"Error in contract_num={contract_num}, error={e}")
        print("*" * 50)
        print(f"Error on contracts {error_contract_container}")
        print("*" * 50)
    else:
        contract_num = args.contract_num

        main(contract_num, contract_dir, is_edit_mode)
