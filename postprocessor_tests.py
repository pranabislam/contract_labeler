import json
import pandas as pd
import numpy as np
import ast
import math
from collections import Counter
import re
import os

def test_apply_remove_periods(df):
    def test_remove_periods(row):
        nrow = row
        xpaths = row['highlighted_xpaths']
        texts = row['highlighted_segmented_text']
        # except:
        #     return pd.Series({'highlighted_xpaths': [], 'highlighted_segmented_text': []})
        indices_to_test = []
        if 'st' not in label:
            return []
        for i, text in enumerate(texts):
            if '.' == text or '. ' == text or ('. ' in text and len(text) == 3):
                indices_to_test.append(i)
        assert indices_to_test == [], \
        f'''In the following row: 
        {row}\n {indices_to_test} are the list of indices where 
        there are still periods.'''
        return indices_to_test
    indices_list = df.apply(lambda row: test_remove_periods(row), axis=1)
    assert all(isinstance(item, list) and len(item) == 0 for item in indices_list)
    print('ALL CHECKS PASSED')
    
def test_filter_all_nodes_df(df):
    new_df = df[
        ~(df['xpaths'].str.contains('/script')) & 
        ~(df['xpaths'].str.contains('/noscript'))
    ]
    new_df = new_df[new_df['xpaths'] != ''].dropna()
    assert (len(new_df) - len(df)) == 0
    print('test_filter_all_nodes_df - ALL CHECKS PASSED')
    
def test_filter_highlight_nodes_df(df):
    new_df = df[
        (df['highlighted_xpaths'] != 'DELETED') &
        (df['highlighted_coordinates'] != 'DEL')
    ].dropna()
    assert (len(new_df) - len(df)) == 0
    print('test_filter_highlight_nodes_df - ALL CHECKS PASSED')

def test_merge(full, highlight, merged):
    # Check for monotonic increasing and find index of violation for all and highlight orders
    for i, row in merged.iterrows():
        if i == 0:
            continue
        prev = merged.iloc[i-1].all_nodes_ordering
        cur = row.all_nodes_ordering
        assert prev < cur, f'At index {i}, the merged dataframe\'s all node order is not monotonically increasing.'
    for i, row in merged.iterrows():
        if i == 0:
            continue
        if str(row.highlighted_xpaths) == 'nan':
            continue
        prev = merged.iloc[i-1].exploded_highlight_node_order
        if str(prev) == 'nan':
            continue
        cur = row.exploded_highlight_node_order
        # print(prev, cur)
        assert prev < cur, f'At index {i}, the merged dataframe\'s exploded highlight node order is not monotonically increasing.'
    
    # Check for no lost left rows
    assert len(full) == len(merged)
    print('test_merge - ALL CHECKS PASSED')
    
def test_tag_bies_for_highlights(df, h_df):
    # Check that count of bies does not exceed number of highlighted rows
    temp = df.reset_index().drop(columns=['index'])
    n_o = temp[temp['size'].astype(str) != 'nan']

    assert len(n_o) <= len(h_df)
    
    # Check that b,e and b,i,e rules are not violated
    b_tags = temp[temp.tagged_sequence.str.contains('b_')].index
    i_tags = temp[temp.tagged_sequence.str.contains('i_')].index
    e_tags = temp[temp.tagged_sequence.str.contains('e_')].index

    for b_tag in b_tags:
        assert 's_' in df.iloc[b_tag - 1].tagged_sequence \
        or 'o' in df.iloc[b_tag - 1].tagged_sequence  \
        or 'e_' in df.iloc[b_tag - 1].tagged_sequence
        
        # FAILING HERE -> b followed by s tag
        assert 'e_' in df.iloc[b_tag + 1].tagged_sequence \
        or 'i_' in df.iloc[b_tag + 1].tagged_sequence
        
    for e_tag in e_tags:
        # FAILING HERE -> e following s tag
        assert 'i_' in df.iloc[b_tag - 1].tagged_sequence \
        or 'b_' in df.iloc[b_tag - 1].tagged_sequence
        
        assert 's_' in df.iloc[b_tag + 1].tagged_sequence \
        or 'o' in df.iloc[b_tag + 1].tagged_sequence \
        or 'b_' in df.iloc[b_tag + 1].tagged_sequence
        
    for i_tag in i_tags:
        assert 'b_' in df.iloc[i_tag - 1].tagged_sequence or 'i_' in df.iloc[i_tag - 1].tagged_sequence
        assert 'e_' in df.iloc[i_tag + 1].tagged_sequence or 'i_' in df.iloc[i_tag + 1].tagged_sequence
    print('test_tag_bies_for_highlights - ALL CHECKS PASSED')
    