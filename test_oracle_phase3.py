import unittest
from unittest.mock import MagicMock, patch
import os
import sys

# Add parent directory to path to import oracle
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock web3 before importing oracle to avoid connection attempts during import
sys.modules['web3'] = MagicMock()
from oracle import load_config, initialize_web3, initialize_contract

class TestOraclePhase3(unittest.TestCase):
    def setUp(self):
        self.env_patcher = patch.dict(os.environ, {
            'RPC_URL': 'http://localhost:8545',
            'PRIVATE_KEY': '0x123',
            'CONTRACT_ADDRESS': '0xABC'
        })
        self.env_patcher.start()

    def tearDown(self):
        self.env_patcher.stop()

    def test_load_config(self):
        config = load_config()
        self.assertEqual(config['rpc_url'], 'http://localhost:8545')
        self.assertEqual(config['private_key'], '0x123')
        self.assertEqual(config['contract_address'], '0xABC')

    def test_load_config_missing(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(ValueError):
                load_config()

    @patch('oracle.Web3')
    def test_initialize_web3(self, mock_web3_cls):
        mock_w3 = MagicMock()
        mock_w3.is_connected.return_value = True
        mock_web3_cls.return_value = mock_w3
        
        w3 = initialize_web3('http://test.url')
        self.assertTrue(w3.is_connected())

    @patch('oracle.Web3')
    def test_initialize_contract(self, mock_web3_cls):
        mock_w3 = MagicMock()
        # Mock checksum address behavior
        mock_w3.to_checksum_address.side_effect = lambda x: x
        # Mock code check
        mock_w3.eth.get_code.return_value = b'code'
        
        contract = initialize_contract(mock_w3, '0xABC', [])
        # Should call contract constructor
        mock_w3.eth.contract.assert_called_once()

if __name__ == '__main__':
    unittest.main()
