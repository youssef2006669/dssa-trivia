import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, loginUser } from '../firebase/auth';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', university: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let result;
    if (isLogin) {
      result = await loginUser(formData.email, formData.password);
    } else {
      result = await registerUser(formData.email, formData.password, formData.name, formData.university);
    }

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      navigate('/dashboard'); // Send them to the dashboard on success
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-dssa-light">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-card">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-dssa-blue">DSSA Alex</h2>
          <p className="text-dssa-gold font-medium mt-1">Trivia Platform</p>
        </div>

        {error && <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input
                type="text" name="name" placeholder="Full Name" required
                className="w-full px-4 py-2 border border-dssa-grey rounded-lg focus:outline-none focus:ring-2 focus:ring-dssa-gold"
                onChange={handleChange}
              />
              <input
                type="text" name="university" placeholder="University" required
                className="w-full px-4 py-2 border border-dssa-grey rounded-lg focus:outline-none focus:ring-2 focus:ring-dssa-gold"
                onChange={handleChange}
              />
            </>
          )}
          <input
            type="email" name="email" placeholder="Email Address" required
            className="w-full px-4 py-2 border border-dssa-grey rounded-lg focus:outline-none focus:ring-2 focus:ring-dssa-gold"
            onChange={handleChange}
          />
          <input
            type="password" name="password" placeholder="Password" required
            className="w-full px-4 py-2 border border-dssa-grey rounded-lg focus:outline-none focus:ring-2 focus:ring-dssa-gold"
            onChange={handleChange}
          />
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 text-white transition-colors rounded-lg bg-dssa-blue hover:bg-opacity-90 disabled:opacity-70 font-semibold"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-semibold text-dssa-gold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
}
