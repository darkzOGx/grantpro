export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage your district profile and preferences
                </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        District Profile
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                District Name
                            </label>
                            <input
                                type="text"
                                defaultValue="Lincoln Unified School District"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                State
                            </label>
                            <input
                                type="text"
                                defaultValue="California"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Total Students
                            </label>
                            <input
                                type="number"
                                defaultValue="12000"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Free Lunch Eligibility (%)
                            </label>
                            <input
                                type="number"
                                defaultValue="65"
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        AI Auto-Apply Settings
                    </h2>
                    <div className="space-y-4">
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                defaultChecked
                                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">
                                Enable AI-powered application drafting
                            </span>
                        </label>
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                defaultChecked
                                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">
                                Automatically pre-fill forms with district data
                            </span>
                        </label>
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">
                                Submit applications automatically (requires approval)
                            </span>
                        </label>
                    </div>
                </div>

                <div className="p-6 flex justify-end">
                    <button className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
