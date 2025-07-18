# Loops Directory

Place your BPM-labeled loop WAV files here, e.g.:

```
loops/
  95bpm/
    E808_Loop_BD_95-01.wav
    ...
  120bpm/
    E808_Loop_BD_120-01.wav
    ...
```

- Each subfolder should be named with the BPM (e.g., `95bpm`).
- Each WAV file should be placed in the correct BPM folder.
- These files will be served at `/api/loops/<bpm>/<filename>`.

**NOTE:**
If you want these loops available on Render, make sure to commit and push them to GitHub, then redeploy your backend.

If no files are present, the API will return 404 for loop requests.
