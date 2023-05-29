import json
import pandas as pd
import numpy as np
import ast
import math
from collections import Counter
import re
import os
import post_process_helper
import postprocessor_tests

def main():

    path_to_labeled_contracts = "/Users/rohith/Documents/Independent Study - DSGA1006/contracts/labeled/"
    #path_to_labeled_contracts = "C:/Users/islam/Desktop/2023 Research/contracts/labeled/"
    contract_num = 29
    #contract_num = 34

    all_nodes_path = f"{path_to_labeled_contracts}contract_{contract_num}_all_nodes.json"
    highlighted_nodes_path = f"{path_to_labeled_contracts}contract_{contract_num}_highlighted.json"
    highlight_nodes_edits_path = f"{path_to_labeled_contracts}edits/contract_{contract_num}_highlighted.json"


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

    all_nodes_df.to_csv(f'{path_to_labeled_contracts}csvs/contract_{contract_num}_all_nodes.csv')
    exploded_highlight_df.to_csv(f'{path_to_labeled_contracts}csvs/contract_{contract_num}_highlighted.csv')
    if os.path.exists(highlight_nodes_edits_path):
        highlight_edits.to_csv(f'{path_to_labeled_contracts}csvs/contract_{contract_num}_edited.csv')

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
    highlight_copy = exploded_highlight_df.copy(deep=True)


if __name__ == '__main__':
    main()