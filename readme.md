## Small python script to list and analyze media directories

### Usage
```
python .\media_info.py Z:\media_dir1,Y:\medie_dir2, ... 
```

The script will download and install ffmpeg if not present.
After the script is finnished, a media_info.json file will be generated.

Start the internal python web server to view your media files with some information.

### Start the web server
```
python -m http.server 8000
```