import React from 'react';
import { useParams } from 'react-router-dom';

export default function Dashboard() {
  const { workspaceId } = useParams();

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-10">
      
      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Performance Overview</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Track your Meta Ads performance metrics.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#2a303c] text-gray-700 dark:text-gray-200 transition-colors">
            <span className="material-symbols-outlined text-[20px]">share</span>
            <span className="text-sm font-medium">Share</span>
          </button>
          <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#2a303c] text-gray-700 dark:text-gray-200 transition-colors">
            <span className="material-symbols-outlined text-[20px]">download</span>
            <span className="text-sm font-medium">Export</span>
          </button>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block mx-1"></div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-surface-dark border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors">
            <span className="material-symbols-outlined text-gray-400 text-[20px]">calendar_today</span>
            <span className="text-sm font-medium dark:text-gray-200">Last 30 Days</span>
            <span className="material-symbols-outlined text-gray-400 text-[18px]">expand_more</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-surface-dark border border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors">
            <span className="material-symbols-outlined text-gray-400 text-[20px]">layers</span>
            <span className="text-sm font-medium dark:text-gray-200">Level: Campaign</span>
            <span className="material-symbols-outlined text-gray-400 text-[18px]">expand_more</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-blue-600 text-white shadow-lg shadow-primary/25 transition-all">
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span className="text-sm font-semibold">Create Campaign</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard 
          title="Amount Spent" 
          value="$12,450.00" 
          change="+12.5%" 
          trend="up" 
          icon="attach_money" 
          iconColor="text-primary" 
          iconBg="bg-primary/10" 
          changeColor="text-emerald-500 bg-emerald-500/10"
        />
        <KpiCard 
          title="Impressions" 
          value="452.8K" 
          change="+8.2%" 
          trend="up" 
          icon="visibility" 
          iconColor="text-purple-500" 
          iconBg="bg-purple-500/10" 
          changeColor="text-emerald-500 bg-emerald-500/10"
        />
        <KpiCard 
          title="CTR (All)" 
          value="1.85%" 
          change="-1.2%" 
          trend="down" 
          icon="touch_app" 
          iconColor="text-orange-500" 
          iconBg="bg-orange-500/10" 
          changeColor="text-rose-500 bg-rose-500/10"
        />
         <KpiCard 
          title="Conversations" 
          value="1,248" 
          change="+15.3%" 
          trend="up" 
          icon="chat" 
          iconColor="text-blue-500" 
          iconBg="bg-blue-500/10" 
          changeColor="text-emerald-500 bg-emerald-500/10"
        />
        <KpiCard 
          title="ROAS" 
          value="3.42" 
          change="+0.4" 
          trend="up" 
          icon="shopping_cart" 
          iconColor="text-emerald-500" 
          iconBg="bg-emerald-500/10" 
          changeColor="text-emerald-500 bg-emerald-500/10"
        />
      </div>

      {/* Trend Analysis Chart */}
      <div className="rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Trend Analysis</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Visualize performance over time.</p>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-background-dark p-1 rounded-lg">
                <button className="px-3 py-1 text-xs font-medium rounded-md bg-white dark:bg-surface-dark shadow-sm text-gray-900 dark:text-white">Spend</button>
                <button className="px-3 py-1 text-xs font-medium rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Results</button>
                <button className="px-3 py-1 text-xs font-medium rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">CPC</button>
            </div>
        </div>
        
        <div className="w-full h-[300px] relative">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300">
                <defs>
                <linearGradient id="gradientPrimary" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#1754cf" stopOpacity="0.3"></stop>
                <stop offset="100%" stopColor="#1754cf" stopOpacity="0"></stop>
                </linearGradient>
                </defs>
                <line opacity="0.2" stroke="#374151" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="250" y2="250"></line>
                <line opacity="0.2" stroke="#374151" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="175" y2="175"></line>
                <line opacity="0.2" stroke="#374151" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="100" y2="100"></line>
                <line opacity="0.2" stroke="#374151" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="25" y2="25"></line>
                <path d="M0,250 C100,220 200,100 300,120 C400,140 500,60 600,80 C700,100 800,40 900,50 L1000,80 V300 H0 Z" fill="url(#gradientPrimary)"></path>
                <path d="M0,250 C100,220 200,100 300,120 C400,140 500,60 600,80 C700,100 800,40 900,50 L1000,80" fill="none" stroke="#1754cf" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>
                <circle className="dark:stroke-surface-dark shadow-xl" cx="600" cy="80" fill="#1754cf" r="6" stroke="#fff" strokeWidth="2"></circle>
            </svg>
            <div className="absolute top-[30px] left-[58%] bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs rounded-lg py-1.5 px-3 shadow-xl transform -translate-x-1/2 pointer-events-none">
                <span className="font-bold">$2,840</span>
                <span className="block text-[10px] opacity-80">Oct 18</span>
            </div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-4 px-2">
            <span>Oct 1</span>
            <span>Oct 5</span>
            <span>Oct 10</span>
            <span>Oct 15</span>
            <span>Oct 20</span>
            <span>Oct 25</span>
            <span>Oct 30</span>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active Campaigns</h3>
            <div className="flex gap-2">
                <button className="p-2 text-gray-500 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">filter_list</span>
                </button>
                <button className="p-2 text-gray-500 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">download</span>
                </button>
            </div>
        </div>
        
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark overflow-hidden shadow-sm">
             <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                     <thead className="bg-gray-50 dark:bg-background-dark/50 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wider">
                         <tr>
                             <th className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                                 <div className="flex items-center gap-2 cursor-pointer hover:text-primary">
                                     Status <span className="material-symbols-outlined text-[16px]">unfold_more</span>
                                 </div>
                             </th>
                             <th className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 w-1/3">Campaign Name</th>
                             <th className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 text-right">Budget</th>
                             <th className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 text-right">Results</th>
                             <th className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 text-right">Cost/Result</th>
                             <th className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 text-right">Amount Spent</th>
                             <th className="px-6 py-4 border-b border-gray-200 dark:border-gray-800"></th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                        <CampaignRow status="active" name="Retargeting - Q4 - Holiday" id="2384910293" budget="$50.00 / day" results="142" resultType="Purchases" cpr="$12.45" spent="$1,768.90" />
                        <CampaignRow status="active" name="Prospecting - Lookalike 1%" id="2384910452" budget="$120.00 / day" results="89" resultType="Purchases" cpr="$24.10" spent="$2,145.50" />
                        <CampaignRow status="paused" name="Brand Awareness - Video Top Funnel" id="2384910991" budget="$30.00 / day" results="12,400" resultType="ThruPlays" cpr="$0.02" spent="$248.00" />
                        <CampaignRow status="error" name="Dynamic Creative - Catalog Sales" id="2384911002" budget="$80.00 / day" results="0" resultType="Purchases" cpr="-" spent="$0.00" />
                     </tbody>
                 </table>
             </div>
             
             <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-background-dark/30">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing <span className="font-medium text-gray-900 dark:text-white">1</span> to <span className="font-medium text-gray-900 dark:text-white">4</span> of <span className="font-medium text-gray-900 dark:text-white">24</span> campaigns
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark text-sm font-medium text-gray-500 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-[#2a303c]" disabled>Previous</button>
                    <button className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2a303c]">Next</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, change, trend, icon, iconColor, iconBg, changeColor }: any) {
    return (
        <div className="group relative flex flex-col gap-1 rounded-xl bg-white dark:bg-surface-dark p-5 border border-gray-200 dark:border-gray-800 hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <div className={`${iconBg} p-1.5 rounded-md ${iconColor}`}>
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                </div>
            </div>
            <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mt-2">{value}</p>
            <div className="flex items-center gap-1.5 mt-1">
                <span className={`flex items-center text-xs font-semibold px-1.5 py-0.5 rounded ${changeColor}`}>
                    <span className="material-symbols-outlined text-[14px] mr-0.5">{trend === 'up' ? 'trending_up' : 'trending_down'}</span>
                    {change}
                </span>
                <span className="text-xs text-gray-400">vs last 30 days</span>
            </div>
        </div>
    )
}

function CampaignRow({ status, name, id, budget, results, resultType, cpr, spent }: any) {
    let statusClasses = "";
    let statusLabel = "";

    if (status === 'active') {
        statusClasses = "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-500";
        statusLabel = "Active";
    } else if (status === 'paused') {
        statusClasses = "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
        statusLabel = "Paused";
    } else {
        statusClasses = "bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-500";
        statusLabel = "Error";
    }

    return (
        <tr className="group hover:bg-gray-50 dark:hover:bg-[#2a303c]/50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusClasses}`}>
                    {status === 'active' || status === 'paused' ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    ) : (
                        <span className="material-symbols-outlined text-[12px]">error</span>
                    )}
                    {statusLabel}
                </span>
            </td>
            <td className="px-6 py-4">
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-white">{name}</span>
                    <span className="text-xs text-gray-500">ID: {id}</span>
                </div>
            </td>
            <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">{budget}</td>
            <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                {results} <span className="text-xs text-gray-500 font-normal">{resultType}</span>
            </td>
            <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-300">{cpr}</td>
            <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">{spent}</td>
            <td className="px-6 py-4 text-right">
                <button className="text-gray-400 hover:text-primary transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
            </td>
        </tr>
    )
}
