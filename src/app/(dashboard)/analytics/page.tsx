export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Track your grant performance and funding trends
                </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-primary-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        Analytics Coming Soon
                    </h2>
                    <p className="text-sm text-gray-500">
                        Track total funding received, success rates, and grant performance
                        metrics over time.
                    </p>
                </div>
            </div>
        </div>
    );
}
