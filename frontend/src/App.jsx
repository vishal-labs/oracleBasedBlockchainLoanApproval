import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import DebugLoan from './DebugLoan';
import AddENS from './AddENS';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/sampletest" element={<DebugLoan />} />
                <Route path="/addENS" element={<AddENS />} />
            </Routes>
        </Router>
    );
};

export default App;
