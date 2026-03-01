import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t mt-20">
      <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-gray-500 flex justify-center space-x-6">
        <Link to="/terms" className="hover:text-gray-800">
          Terms & Conditions
        </Link>
        <Link to="/privacy" className="hover:text-gray-800">
          Privacy Policy
        </Link>
        <Link to="/contact" className="hover:text-gray-800">
          Contact
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
