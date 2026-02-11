import unittest
from unittest.mock import MagicMock, patch
import sys
import os
import pickle
import numpy as np
import pandas as pd

# Add parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock web3
sys.modules['web3'] = MagicMock()

# Import oracle after mocking
import oracle

class TestOraclePhase5(unittest.TestCase):
    def setUp(self):
        # Create a dummy model for testing
        self.dummy_model = MagicMock()
        self.dummy_model.predict.return_value = np.array([750.0])
        
        # Patch the global ml_model in oracle
        self.patcher = patch('oracle.ml_model', self.dummy_model)
        self.mock_model = self.patcher.start()
        
    def tearDown(self):
        self.patcher.stop()

    @patch('oracle.w3')
    def test_compute_credit_score_with_model(self, mock_w3):
        # Mock blockchain data
        mock_w3.eth.get_balance.return_value = 10**18 # 1 ETH
        mock_w3.from_wei.return_value = 1.0
        mock_w3.eth.get_transaction_count.return_value = 5
        
        # Input data
        ens_name = "test.eth"
        loan_data = {'loan_value_inr': 100000}
        social_data = {'linked': True}
        borrower_address = "0x123"
        
        score = oracle.compute_credit_score(ens_name, loan_data, social_data, borrower_address)
        
        # Verify prediction called
        self.assertTrue(self.mock_model.predict.called)
        
        # Verify partial frame content passed to predict
        # We can't easily check dataframe content equality in mock call args without complex matching
        # But we can check it returned the prediction
        self.assertEqual(score, 750)

    @patch('oracle.w3')
    def test_compute_credit_score_fallback(self, mock_w3):
        # Configure w3 mocks to return integers
        mock_w3.eth.get_balance.return_value = 0
        mock_w3.from_wei.return_value = 0.0
        mock_w3.eth.get_transaction_count.return_value = 5 # < 10

        # Simulate model failure
        self.mock_model.predict.side_effect = Exception("Model Error")
        
        score = oracle.compute_credit_score("test.eth", {'loan_value_inr': 100000}, {'linked': True}, "0x123")
        
        # Should fall back to rule based
        # Rules: 600 + 50 (social) = 650.
        # Balance 0.0 <= 1.0 -> +0
        # Tx 5 <= 10 -> +0
        self.assertEqual(score, 650)

if __name__ == '__main__':
    unittest.main()
