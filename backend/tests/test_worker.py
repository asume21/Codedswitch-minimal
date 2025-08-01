"""
Test script for the music generation worker.

This script tests the worker's ability to process music generation tasks
from the Redis queue and update job statuses correctly.
"""
import os
import time
import json
import redis
import unittest
import threading
from unittest.mock import patch, MagicMock
from rq import Queue, Worker

# Add parent directory to path
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the worker module
import worker as worker_module

class TestWorker(unittest.TestCase):
    """Test cases for the music generation worker."""

    @classmethod
    def setUpClass(cls):
        """Set up test environment before any tests run."""
        # Use a test Redis database
        cls.redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/1')
        cls.conn = redis.Redis.from_url(cls.redis_url)
        
        # Clear the test database
        cls.conn.flushdb()
        
        # Create a test queue
        cls.queue = Queue('test_queue', connection=cls.conn)
        
        # Patch the worker's queue to use our test queue
        cls.patcher = patch('worker.redis_conn', cls.conn)
        cls.patcher.start()
        
        # Start a worker in a separate thread
        cls.worker = Worker(
            [cls.queue.name],
            connection=cls.conn,
            name='test_worker'
        )
        cls.worker_thread = threading.Thread(
            target=cls.worker.work,
            kwargs={'with_scheduler': False}
        )
        cls.worker_thread.daemon = True
        cls.worker_thread.start()
        
        # Give the worker time to start
        time.sleep(1)

    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests have run."""
        # Stop the worker
        if hasattr(cls, 'worker'):
            cls.worker.shutdown()
        if hasattr(cls, 'worker_thread'):
            cls.worker_thread.join(timeout=5)
        
        # Clean up Redis
        if hasattr(cls, 'conn'):
            cls.conn.flushdb()
            cls.conn.close()
        
        # Stop patching
        if hasattr(cls, 'patcher'):
            cls.patcher.stop()
    
    def setUp(self):
        """Set up before each test method."""
        # Clear the queue before each test
        self.conn.flushdb()
    
    def test_update_job_status(self):
        """Test updating job status in Redis."""
        job_id = 'test_job_123'
        status = 'processing'
        progress = 50
        
        # Call the function
        worker_module.update_job_status(job_id, status, progress=progress)
        
        # Check that the status was updated in Redis
        result = self.conn.hgetall(f'job:{job_id}')
        self.assertIsNotNone(result)
        self.assertEqual(result[b'status'].decode(), status)
        self.assertEqual(int(result[b'progress']), progress)
        self.assertIn(b'updated_at', result)
    
    @patch('worker.generate_instrumental')
    def test_generate_task_success(self, mock_generate):
        """Test successful music generation task."""
        # Set up test data
        job_id = 'test_success_123'
        lyrics = "Test lyrics"
        prompt = "Test prompt"
        duration = 10
        test_audio_path = "/tmp/test_audio.wav"
        
        # Mock the generate_instrumental function
        mock_generate.return_value = test_audio_path
        
        # Create a test file
        with open(test_audio_path, 'wb') as f:
            f.write(b'test audio data')
        
        try:
            # Submit the job
            job = self.queue.enqueue(
                worker_module.generate_task,
                job_id, lyrics, prompt, duration,
                job_id=job_id
            )
            
            # Wait for the job to complete
            time.sleep(2)
            
            # Check that the job completed successfully
            self.assertTrue(job.is_finished)
            
            # Check that the job status was updated
            result = self.conn.hgetall(f'job:{job_id}')
            self.assertIsNotNone(result)
            self.assertEqual(result[b'status'].decode(), 'finished')
            self.assertEqual(int(result[b'progress']), 100)
            self.assertEqual(result[b'filePath'].decode(), test_audio_path)
            
        finally:
            # Clean up
            if os.path.exists(test_audio_path):
                os.remove(test_audio_path)
    
    @patch('worker.generate_instrumental')
    def test_generate_task_failure(self, mock_generate):
        """Test failed music generation task."""
        # Set up test data
        job_id = 'test_failure_123'
        lyrics = "Test lyrics"
        prompt = "Test prompt"
        duration = 10
        
        # Make generate_instrumental raise an exception
        mock_generate.side_effect = Exception("Test error")
        
        # Submit the job
        job = self.queue.enqueue(
            worker_module.generate_task,
            job_id, lyrics, prompt, duration,
            job_id=job_id
        )
        
        # Wait for the job to complete
        time.sleep(2)
        
        # Check that the job failed
        self.assertTrue(job.is_failed)
        
        # Check that the job status was updated with the error
        result = self.conn.hgetall(f'job:{job_id}')
        self.assertIsNotNone(result)
        self.assertEqual(result[b'status'].decode(), 'failed')
        self.assertIn(b'error', result)
        self.assertIn(b'error_traceback', result)

if __name__ == '__main__':
    unittest.main()
