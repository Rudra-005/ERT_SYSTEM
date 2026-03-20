import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ onClick }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onClick) {
      onClick();
      return;
    }
    
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <button
      onClick={handleBack}
      className="p-2 rounded-lg hover:bg-slate-800/80 cursor-pointer text-slate-400 hover:text-white transition-colors flex items-center justify-center border border-transparent hover:border-slate-700"
      title="Go Back"
    >
      <ArrowLeft size={20} />
    </button>
  );
}
