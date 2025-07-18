import os
import redis
import uuid
from rq import Queue, Connection, Worker
from musicgen_backend import generate_instrumental

# Setup Redis connection and task queue
redis_url = os.environ.get('REDIS_URL')
if not redis_url:
    raise RuntimeError("REDIS_URL environment variable not set")
redis_conn = redis.from_url(redis_url)
task_queue = Queue('default', connection=redis_conn)

def generate_task(job_id, lyrics, prompt, duration):
    """Background task to generate audio and store path in Redis"""
    wav_path = generate_instrumental(lyrics, prompt, duration)
    # Mark job as finished and store file path
    redis_conn.hset(f"job:{job_id}", mapping={"status": "finished", "filePath": wav_path})

if __name__ == '__main__':
    # Worker entrypoint
    with Connection(redis_conn):
        worker = Worker([task_queue.name], connection=redis_conn)
        worker.work()
