import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center pt-[20px] pb-[40px]">
      <Link to="/">
        <img className="w-[120px] mb-[20px]" src="/images/amazon-logo.png" alt="Amazon" />
      </Link>

      <div className="w-full max-w-[350px] border border-[#d5d9d9] rounded-[4px] p-[24px]">
        <h1 className="text-[28px] font-normal mb-[16px]">
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </h1>

        {error && (
          <div className="bg-[#fff5f5] border border-[#c40000] text-[#c40000] text-[13px] p-[8px] rounded-[4px] mb-[12px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-[10px]">
          <label className="text-[13px] font-bold">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-[#a6a6a6] rounded-[3px] h-[31px] px-[7px] text-[13px] outline-none focus:border-[#e77600] focus:shadow-[0_0_0_3px_rgba(228,121,17,0.5)]"
          />

          <label className="text-[13px] font-bold mt-[4px]">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-[#a6a6a6] rounded-[3px] h-[31px] px-[7px] text-[13px] outline-none focus:border-[#e77600] focus:shadow-[0_0_0_3px_rgba(228,121,17,0.5)]"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-[6px] bg-[#ffd814] border border-[#fcd200] rounded-[8px] py-[6px] text-[13px] cursor-pointer hover:bg-[#f7ca00] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="text-[12px] mt-[16px] text-center">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            className="text-[#0066c0] bg-transparent border-none cursor-pointer text-[12px] hover:text-[#c45000] hover:underline"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          >
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
