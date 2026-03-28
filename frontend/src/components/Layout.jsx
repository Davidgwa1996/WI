import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar = () => (
  <motion.nav 
    initial={{ y: -100 }}
    animate={{ y: 0 }}
    transition={{ duration: 0.5 }}
    className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-white/10"
  >
    <div className="container mx-auto px-4 py-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
        Web3 Intel
      </Link>
      <div className="space-x-6">
        <Link to="/" className="text-gray-300 hover:text-white transition">Dashboard</Link>
        <Link to="/projects" className="text-gray-300 hover:text-white transition">Projects</Link>
        <Link to="/competitors" className="text-gray-300 hover:text-white transition">Competitors</Link>
      </div>
    </div>
  </motion.nav>
);

const Layout = ({ children }) => (
  <div className="min-h-screen">
    <Navbar />
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      {children}
    </motion.main>
  </div>
);

export default Layout;
