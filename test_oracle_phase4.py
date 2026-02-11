import unittest
from unittest.mock import MagicMock, patch
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock dependencies
sys.modules['web3'] = MagicMock()
from oracle import check_social_media_links, get_eth_to_inr_price

class TestOraclePhase4(unittest.TestCase):
    
    @patch('numpy.random.random')
    def test_social_media_linked(self, mock_random):
        # Mock random > 0.3 (returns 0.8)
        mock_random.return_value = 0.8
        
        result = check_social_media_links("vitalik.eth")
        self.assertTrue(result['linked'])
        self.assertIn('com.twitter', result['platforms'])

    @patch('numpy.random.random')
    def test_social_media_not_linked(self, mock_random):
        # Mock random <= 0.3 (returns 0.1)
        mock_random.return_value = 0.1
        
        result = check_social_media_links("anon.eth")
        self.assertFalse(result['linked'])
        self.assertEqual(len(result['platforms']), 0)

    @patch('requests.get')
    def test_get_price_success(self, mock_get):
        # Mock API response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'ethereum': {
                'inr': 250000,
                'usd': 3000
            }
        }
        mock_get.return_value = mock_response
        
        # We need to mock w3.from_wei in oracle.py module
        # Since we mocked web3 module, we need to access the w3 object in oracle
        import oracle
        oracle.w3.from_wei.side_effect = lambda val, unit: val / 10**18
        
        # Test Case 1: 1 ETH -> 2.5 Lakh INR -> Interest 11% (Logic: >1Lakh=11%, >5Lakh=10%)
        # Logic: 
        # > 10L: 8%
        # > 5L: 10%
        # > 1L: 11%
        # < 1L: 12%
        
        amount_wei = 10**18 # 1 ETH
        data = get_eth_to_inr_price(amount_wei)
        
        self.assertEqual(data['eth_to_inr'], 250000)
        self.assertEqual(data['loan_value_inr'], 250000)
        self.assertEqual(data['base_interest'], 11.0)
        
        # Test Case 2: 10 ETH -> 25 Lakh INR -> > 10L -> 8%
        data_whale = get_eth_to_inr_price(10 * 10**18)
        self.assertEqual(data_whale['base_interest'], 8.0)

    @patch('requests.get')
    def test_get_price_failure(self, mock_get):
        mock_get.side_effect = Exception("API Down")
        
        import oracle
        oracle.w3.from_wei.side_effect = lambda val, unit: val / 10**18
        
        data = get_eth_to_inr_price(10**18)
        
        # Should return defaults
        self.assertEqual(data['eth_to_inr'], 200000.0)
        self.assertEqual(data['base_interest'], 11.0) # 2L > 1L so 11%

if __name__ == '__main__':
    unittest.main()
