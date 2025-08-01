#!/usr/bin/env python3
"""
End-to-end test script for the music generation worker.

This script demonstrates how to submit a job to the worker and monitor its progress.
"""
import os
import time
import json
import redis
import argparse
from rq import Queue
from uuid import uuid4

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Test the music generation worker')
    parser.add_argument('--redis-url', default='redis://localhost:6379/0',
                       help='Redis connection URL')
    parser.add_argument('--lyrics', default="""
        Verse 1:
        Testing, testing, one two three
        Can the worker generate music for me?
        
        Chorus:
        Yes it can, yes it will
        Generate music with skill!
    """, help='Lyrics for the song')
    parser.add_argument('--prompt', default='upbeat electronic pop with catchy melody',
                      help='Music style prompt')
    parser.add_argument('--duration', type=int, default=15,
                      help='Duration of the generated audio in seconds')
    args = parser.parse_args()
    
    # Set up Redis connection
    conn = redis.Redis.from_url(args.redis_url)
    queue = Queue(connection=conn)
    
    # Generate a unique job ID
    job_id = f'test_{uuid4().hex[:8]}'
    
    print(f"Submitting job {job_id} to generate {args.duration}s of music...")
    print(f"Prompt: {args.prompt}")
    print("-" * 50)
    
    # Submit the job
    job = queue.enqueue(
        'worker.generate_task',
        job_id, args.lyrics, args.prompt, args.duration,
        job_id=job_id,
        job_timeout=600  # 10 minute timeout
    )
    
    # Monitor job status
    last_progress = -1
    while True:
        # Get job status from Redis
        status = conn.hgetall(f'job:{job_id}')
        
        if not status:
            print("\nError: Job not found in Redis")
            break
            
        # Convert bytes to strings
        status = {k.decode(): v.decode() for k, v in status.items()}
        
        # Print progress updates
        if 'progress' in status and int(status['progress']) > last_progress:
            last_progress = int(status['progress'])
            print(f"\rProgress: {status['progress']}% - {status.get('status', '')}", end='')
        
        # Check for completion or failure
        if status.get('status') == 'finished':
            print(f"\n\nSuccess! Audio file: {status.get('filePath', 'unknown')}")
            break
            
        if status.get('status') == 'failed':
            print(f"\n\nJob failed: {status.get('error', 'Unknown error')}")
            if 'error_traceback' in status:
                print("\nTraceback:")
                print(status['error_traceback'])
            break
            
        # Wait before polling again
        time.sleep(1)
    
    print("\nDone!")

if __name__ == '__main__':
    main()
