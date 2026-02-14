import { useState, useEffect } from 'react';
import { 
  Save, 
  RefreshCw, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  Building,
  ShoppingCart,
  Crown,
  Gift
} from 'lucide-react';
import { useSettings, Setting } from '../hooks/useSettings';

export default function SettingsAdmin() {
  const { 
    settings, 
    loading, 
    getSettingsByCategory, 
    updateSetting,
    refetch,
    getNumberSetting,
    addSetting
  } = useSettings();
  
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Initialize edited settings when settings load
  useEffect(() => {
    const edited: Record<string, string> = {};
    settings.forEach(s => {
      edited[s.key] = s.value;
    });
    setEditedSettings(edited);
  }, [settings]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = async (setting: Setting) => {
    const newValue = editedSettings[setting.key];
    if (newValue === setting.value) return; // No change

    setSaving(setting.key);
    const result = await updateSetting(setting.key, newValue);
    setSaving(null);

    if (result.success) {
      showNotification('success', `${setting.label} updated successfully`);
    } else {
      showNotification('error', result.message);
    }
  };

  const handleChange = (key: string, value: string) => {
    setEditedSettings(prev => ({ ...prev, [key]: value }));
  };

  const hasChanged = (key: string, originalValue: string) => {
    return editedSettings[key] !== originalValue;
  };

  const categories = [
    { 
      id: 'pricing', 
      label: 'Pricing Settings', 
      description: 'Manage delivery fees, minimums, and charges',
      icon: DollarSign,
      color: 'bg-green-100 text-green-600'
    },
    { 
      id: 'business', 
      label: 'Business Information', 
      description: 'Your business contact details',
      icon: Building,
      color: 'bg-blue-100 text-blue-600'
    },
    { 
      id: 'orders', 
      label: 'Order Settings', 
      description: 'Booking and scheduling rules',
      icon: ShoppingCart,
      color: 'bg-orange-100 text-orange-600'
    },
    { 
      id: 'membership', 
      label: 'Membership Settings', 
      description: 'Member discounts and benefits',
      icon: Crown,
      color: 'bg-pink-100 text-[#e14171]'
    },
    { 
      id: 'referrals', 
      label: 'Referral & Credits', 
      description: 'Set how much referrers and new customers earn',
      icon: Gift,
      color: 'bg-rose-100 text-rose-600'
    },
    { 
      id: 'awards', 
      label: 'Referral Awards', 
      description: 'Set thresholds and free-order awards for top referrers',
      icon: Crown,
      color: 'bg-indigo-100 text-indigo-600'
    }
  ];

  // Seed default award settings if missing
  useEffect(() => {
    if (loading || settings.length === 0) return;

    const defaults = [
      {
        key: 'award_min_lifetime_earnings',
        value: '1000',
        label: 'Award minimum lifetime earnings',
        description: 'Total earned credits required to qualify for an award',
        type: 'number' as const,
        category: 'awards',
        sort_order: 0
      },
      {
        key: 'award_free_order_count',
        value: '3',
        label: 'Award free order count',
        description: 'How many free orders the award grants',
        type: 'number' as const,
        category: 'awards',
        sort_order: 1
      },
      {
        key: 'award_free_order_cap',
        value: '25',
        label: 'Free order cap (per order)',
        description: 'Maximum value covered per free award order',
        type: 'number' as const,
        category: 'awards',
        sort_order: 2
      },
      {
        key: 'award_valid_months',
        value: '2',
        label: 'Award validity (months)',
        description: 'How long the award voucher stays valid',
        type: 'number' as const,
        category: 'awards',
        sort_order: 3
      }
    ];

    const existingKeys = new Set(settings.map(s => s.key));

    defaults.forEach(async (def) => {
      if (!existingKeys.has(def.key)) {
        await addSetting(def);
      }
    });
  }, [loading, settings, addSetting]);

  // Quick reference values for promos/delivery callout
  const deliveryFee = getNumberSetting('delivery_fee', 5);
  const freeDeliveryThreshold = getNumberSetting('free_delivery_threshold', 50);
  const referrerBonus = getNumberSetting('referral_referrer_bonus', 10);
  const refereeBonus = getNumberSetting('referral_referee_bonus', 10);

  const renderSettingInput = (setting: Setting) => {
    const value = editedSettings[setting.key] ?? setting.value;
    const changed = hasChanged(setting.key, setting.value);
    const isSaving = saving === setting.key;

    return (
      <div key={setting.key} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {setting.label}
          </label>
          {setting.description && (
            <p className="text-xs text-gray-500 mb-2">{setting.description}</p>
          )}
          
          {setting.type === 'number' ? (
            <div className="relative">
              {setting.key.includes('fee') || setting.key.includes('price') || 
               setting.key.includes('threshold') || setting.key.includes('minimum') ||
               setting.key.includes('hold') ? (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              ) : null}
              <input
                type="number"
                value={value}
                onChange={(e) => handleChange(setting.key, e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e14171] ${
                  setting.key.includes('fee') || setting.key.includes('price') || 
                  setting.key.includes('threshold') || setting.key.includes('minimum') ||
                  setting.key.includes('hold') ? 'pl-8' : ''
                } ${changed ? 'border-[#e14171] bg-pink-50' : ''}`}
              />
              {setting.key.includes('discount') && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              )}
              {setting.key.includes('hours') && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">hrs</span>
              )}
              {setting.key.includes('days') && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">days</span>
              )}
            </div>
          ) : setting.type === 'boolean' ? (
            <select
              value={value}
              onChange={(e) => handleChange(setting.key, e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e14171] ${
                changed ? 'border-[#e14171] bg-pink-50' : ''
              }`}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(setting.key, e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e14171] ${
                changed ? 'border-[#e14171] bg-pink-50' : ''
              }`}
            />
          )}
        </div>

        <button
          onClick={() => handleSave(setting)}
          disabled={!changed || isSaving}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
            changed
              ? 'bg-[#e14171] text-white hover:bg-[#c73562]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {notification.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">App Settings</h2>
          <p className="text-gray-500">Configure delivery fees, minimums, and other settings</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Promo & Delivery summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Delivery Fee</p>
          <p className="text-2xl font-bold text-gray-900">${deliveryFee.toFixed(2)}</p>
          <p className="text-xs text-gray-500">Used for free-delivery promos</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Free Delivery Threshold</p>
          <p className="text-2xl font-bold text-gray-900">${freeDeliveryThreshold.toFixed(2)}</p>
          <p className="text-xs text-gray-500">Orders above this skip delivery fee</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Referee Bonus</p>
          <p className="text-2xl font-bold text-gray-900">${refereeBonus.toFixed(2)}</p>
          <p className="text-xs text-gray-500">New customer credit for using a code</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Referrer Bonus</p>
          <p className="text-2xl font-bold text-gray-900">${referrerBonus.toFixed(2)}</p>
          <p className="text-xs text-gray-500">Paid when first order is delivered</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#e14171]" />
        </div>
      ) : settings.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No settings found</p>
          <p className="text-sm">Run the SQL setup to create default settings</p>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => {
            const categorySettings = getSettingsByCategory(category.id);
            if (categorySettings.length === 0) return null;

            return (
              <div key={category.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Category Header */}
                <div className="p-6 border-b bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${category.color}`}>
                      <category.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{category.label}</h3>
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="p-6 space-y-4">
                  {categorySettings.map((setting) => renderSettingInput(setting))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-[#e14171] p-3 rounded-xl">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Settings Information</h3>
            <p className="text-gray-600 text-sm mb-3">
              Changes to these settings will immediately affect how the site works:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Delivery Fee</strong> - Charged at checkout for each order</li>
              <li>• <strong>Free Delivery Threshold</strong> - Orders above this amount get free delivery</li>
              <li>• <strong>Minimum Order</strong> - Customers can't checkout below this amount</li>
              <li>• <strong>Member Discounts</strong> - Applied to Bubble Pass subscribers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
