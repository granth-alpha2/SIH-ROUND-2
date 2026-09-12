import json
import pandas as pd
import glob
import os

base_dir = r"c:\SIH\SIH2026"
csv_files = glob.glob(os.path.join(base_dir, "Dataset", "**", "*.csv"), recursive=True)

report = {}
for path in sorted(csv_files):
    rel = os.path.relpath(path, base_dir)
    df = pd.read_csv(path)
    
    # Analyze coverage
    states = df['state'].unique().tolist() if 'state' in df.columns else []
    crops = df['crop_name'].unique().tolist() if 'crop_name' in df.columns else []
    
    time_cols = [c for c in df.columns if any(k in c.lower() for k in ['date', 'year', 'month'])]
    time_range = {}
    for tc in time_cols:
        if tc in df.columns:
            time_range[tc] = {
                'min': str(df[tc].min()),
                'max': str(df[tc].max()),
                'uniques': int(df[tc].nunique())
            }
            
    numeric_stats = {}
    for c in df.select_dtypes(include=['float64', 'int64']).columns:
        numeric_stats[c] = {
            'min': float(df[c].min()),
            'max': float(df[c].max()),
            'mean': round(float(df[c].mean()), 2),
            'has_negative': bool((df[c] < 0).any())
        }
        
    report[rel] = {
        'row_count': len(df),
        'col_count': len(df.columns),
        'columns': list(df.columns),
        'states_covered': len(states),
        'sample_states': states[:5],
        'crops_covered': len(crops),
        'sample_crops': crops[:5],
        'time_coverage': time_range,
        'numeric_stats': numeric_stats,
        'null_cells': int(df.isnull().sum().sum()),
        'duplicates': int(df.duplicated().sum())
    }

with open(r"c:\SIH\SIH2026\docs\ai-ml\deep_dataset_metrics.json", "w") as f:
    json.dump(report, f, indent=2)

print("Wrote deep dataset metrics to docs/ai-ml/deep_dataset_metrics.json")

