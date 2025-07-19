#!/bin/bash
set -e

echo "Installing system dependencies..."
apt-get update
apt-get install -y \
    ffmpeg \
    libavformat-dev \
    libavcodec-dev \
    libavdevice-dev \
    libavutil-dev \
    libavfilter-dev \
    libswscale-dev \
    libswresample-dev \
    pkg-config \
    build-essential

echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Build completed successfully!"
