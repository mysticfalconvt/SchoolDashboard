#!/usr/bin/env python3
"""
Final script to fix CSV file by removing first two lines from quoted sections that span 3 lines.
Keeps only the teacher name (third line) from each multi-line quoted field.
"""

import re
import sys
from pathlib import Path

def fix_csv_content(content):
    """
    Process CSV content and fix quoted sections that span 3 lines.
    For each quoted section with 3 lines, keep only the third line (teacher name).
    """
    # First, let's handle the standard pattern: "text\nnumber\ntext"
    pattern1 = r'"([^"]*)\n(\d+[^"]*)\n([^"]*)"'
    
    def replace_match1(match):
        course_name = match.group(1)
        room_number = match.group(2)
        teacher_name = match.group(3)
        
        # Only replace if it looks like a course/room/teacher pattern
        if (course_name and room_number and teacher_name and 
            any(char.isdigit() for char in room_number) and
            ',' in teacher_name):  # Teacher names typically have commas
            return f'"{teacher_name}"'
        else:
            return match.group(0)  # Keep original if it doesn't match the pattern
    
    content = re.sub(pattern1, replace_match1, content, flags=re.MULTILINE)
    
    # Now handle other 3-line patterns like "Physical Ed.\nGYM\nAuclair, Peter"
    pattern2 = r'"([^"]*)\n([^"]*)\n([^"]*)"'
    
    def replace_match2(match):
        line1 = match.group(1).strip()
        line2 = match.group(2).strip()
        line3 = match.group(3).strip()
        
        # Check if this looks like a 3-line section where the third line is a teacher name
        if (line1 and line2 and line3 and 
            ',' in line3 and  # Teacher names typically have commas
            not any(char.isdigit() for char in line1) and  # First line shouldn't be just numbers
            (line2 == 'GYM' or any(char.isdigit() for char in line2))):  # Second line is room or GYM
            return f'"{line3}"'
        else:
            return match.group(0)  # Keep original if it doesn't match the pattern
    
    content = re.sub(pattern2, replace_match2, content, flags=re.MULTILINE)
    
    return content

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 fix_csv_final.py <input_file>")
        sys.exit(1)
    
    input_file = Path(sys.argv[1])
    
    if not input_file.exists():
        print(f"Error: Input file '{input_file}' does not exist.")
        sys.exit(1)
    
    # Create output filename in the same directory with CONVERTED prefix
    output_file = input_file.parent / f"CONVERTED_{input_file.name}"
    
    try:
        # Read the input file
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Fix the content
        fixed_content = fix_csv_content(content)
        
        # Write the output file
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        
        print(f"Successfully processed '{input_file}' -> '{output_file}'")
        
    except Exception as e:
        print(f"Error processing file: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
