import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNewsletter } from '../hooks/useNewsletter';
import { AuthModal } from '../components/AuthModal';

export function Unsubscribe() {
  const { user } = useAuth();
  const { loading, unsubscribe, message, error, clear } = useNewsletter();
  const [email, setEmail] = useState('');
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const result = await unsubscribe(email);
    if (result.success) {
      // nothing else, the message will show and form will be replaced
    }
  };

  const showLogin = !user;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white max-w-lg w-full rounded-2xl shadow-sm p-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Unsubscribe</h1>
          <p className="text-gray-600">
            We’ll stop marketing emails to this address. Transactional emails (order updates, receipts) will still arrive.
          </p>
        </div>

        {showLogin ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please sign in so we can identify your email automatically.
            </p>
            <button
              onClick={() => setAuthOpen(true)}
              className="w-full py-3 bg-[#e14171] text-white rounded-xl font-semibold hover:bg-[#c73562]"
            >
              Sign in to continue
            </button>
          </div>
        ) : message ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">😔</div>
            <h2 className="text-2xl font-semibold text-[#e14171]">Sad to see you go</h2>
            <p className="text-sm text-gray-600">
              You’ve been unsubscribed from marketing emails. Transactional emails will still be sent.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                value={email}
                readOnly
                className="w-full px-4 py-3 border rounded-xl bg-gray-100 text-gray-700"
              />
              <p className="text-xs text-gray-500">We’re using your signed-in email.</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#e14171] text-white rounded-xl font-semibold hover:bg-[#c73562] disabled:opacity-50"
            >
              {loading ? 'Updating…' : 'Unsubscribe from marketing emails'}
            </button>
          </form>
        )}

        {error && (
          <div className="p-3 rounded-xl text-sm bg-red-50 text-red-700">
            {error}
          </div>
        )}

        <p className="text-xs text-gray-500">
          Need help? Email <span className="font-medium text-gray-700">support@bubblebox.com</span>.
        </p>
      </div>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode="signin"
      />
    </div>
  );
}
