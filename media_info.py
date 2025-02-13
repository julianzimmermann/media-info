import os
import subprocess
import json
import sys
import urllib.request
import zipfile

def get_video_info(file_path, bin_path):
    try:
        result = subprocess.run(
            [os.path.join(bin_path, 'ffprobe'), '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8'
        )
        return json.loads(result.stdout)
    except Exception as e:
        print(f"Error getting video info for {file_path}: {e}")
        return None

def list_files_and_folders(path, bin_path):
    def recursive_list(path):
        items = []
        for entry in os.scandir(path):
            if entry.is_dir():
                items.append({
                    'path': entry.path,
                    'type': 'directory',
                    'contents': recursive_list(entry.path)
                })
            else:
                if entry.name.lower().endswith(('.mp4', '.mkv', '.avi', '.mov', '.wmv', '.mpg', '.mpeg')):
                    video_info = get_video_info(entry.path, bin_path)
                    items.append({
                        'path': entry.path,
                        'type': 'video',
                        'info': video_info
                    })
                else:
                    items.append({
                        'path': entry.path,
                        'type': 'file'
                    })
        return items

    return recursive_list(path)

def download_and_extract_ffmpeg():
    url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
    zip_path = "ffmpeg-release-essentials.zip"
    extract_path = "ffmpeg"

    if not os.path.exists(extract_path):
        if not os.path.exists(zip_path):
            print("Downloading FFmpeg...")
            urllib.request.urlretrieve(url, zip_path)
        else:
            print("FFmpeg zip file already exists.")

        print("Extracting FFmpeg...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)

    for root, dirs, files in os.walk(extract_path):
        for dir_name in dirs:
            if dir_name.endswith('essentials_build'):
                bin_path = os.path.join(root, dir_name, 'bin')
                return bin_path
    return None

def check_ffmpeg_installed(bin_path=''):
    try:
        subprocess.run([os.path.join(bin_path, 'ffmpeg'), '-version'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        subprocess.run([os.path.join(bin_path, 'ffprobe'), '-version'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True
    except FileNotFoundError:
        return False
    
def get_ffmpeg_path():
    if not check_ffmpeg_installed():
        return download_and_extract_ffmpeg()
    else:
        return ''

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python media_info.py <path1>,<path2>,...,<pathn>")
        sys.exit(1)

    bin_path = ''

    if not check_ffmpeg_installed():
        bin_path = download_and_extract_ffmpeg()
        if not check_ffmpeg_installed(bin_path):
            print("FFmpeg installation failed. Please install it manually.")
            sys.exit(1)
        else:
            print("FFmpeg installed successfully.")
    else:
        print("FFmpeg is installed.")
    
    paths = sys.argv[1].split(',')
    all_results = []

    for path in paths:
        if not os.path.exists(path):
            print(f"The path {path} does not exist.")
            continue
        
        result = list_files_and_folders(path, bin_path)
        all_results.extend(result)
    
    with open('media_info.json', 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=4)
    
    print("Results saved to media_info.json")