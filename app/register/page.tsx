'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Redirect to login
      router.push('/login?registered=true');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-casino-black flex items-center justify-center px-4 md:px-8 lg:px-16 py-8">
      <div className="bg-casino-black-lighter border border-casino-gray-darker rounded-xl p-8 w-full max-w-md">
        <h1 className="text-4xl font-display text-casino-white mb-6 text-center">
          Register
        </h1>
        
        {error && (
          <div className="bg-casino-accent-primary/10 border border-casino-accent-primary text-casino-accent-primary px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-casino-gray-light mb-2 text-sm">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={50}
              className="w-full px-4 py-3 bg-casino-gray-darker border border-casino-gray rounded-lg text-casino-white placeholder:text-casino-gray-light focus:outline-none focus:border-casino-accent-primary transition-colors duration-200"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-casino-gray-light mb-2 text-sm">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-casino-gray-darker border border-casino-gray rounded-lg text-casino-white placeholder:text-casino-gray-light focus:outline-none focus:border-casino-accent-primary transition-colors duration-200"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-casino-gray-light mb-2 text-sm">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-casino-gray-darker border border-casino-gray rounded-lg text-casino-white placeholder:text-casino-gray-light focus:outline-none focus:border-casino-accent-primary transition-colors duration-200"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-casino-gray-light mb-2 text-sm">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-casino-gray-darker border border-casino-gray rounded-lg text-casino-white placeholder:text-casino-gray-light focus:outline-none focus:border-casino-accent-primary transition-colors duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-casino-accent-primary text-casino-white font-semibold rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-150 shadow-lg shadow-casino-accent-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-casino-gray-light">
          Already have an account?{' '}
          <Link href="/login" className="text-casino-accent-primary hover:underline">
            Login
          </Link>
        </p>

        <Link
          href="/"
          className="block mt-4 text-center text-casino-gray transition-colors hover:text-casino-gray-light"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}

