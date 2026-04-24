import React from 'react';

interface LearningVideoSectionProps {
  query: string;
}

const LearningVideoSection: React.FC<LearningVideoSectionProps> = ({ query }) => {
  // Common educational YouTube channels for ASL/Sign Language
  const learningChannels = [
    { name: 'Bill Vicars (ASL University)', url: 'https://www.youtube.com/@billvicars' },
    { name: 'Signed with Courtney', url: 'https://www.youtube.com/@SignedWithCourtney' },
    { name: 'ASL Meredith', url: 'https://www.youtube.com/@ASLMeredith' }
  ];

  // Search URL for the specific phrase
  const searchUrl = `https://www.youtube.com/results?search_query=asl+sign+for+${encodeURIComponent(query)}`;

  return (
    <div className="mt-4 p-4 rounded-xl bg-theme-secondary/50 border border-theme-tertiary">
      <h3 className="text-sm font-bold text-theme-primary mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        Learn from Real Signers
      </h3>

      <div className="space-y-4">
        {/* Search Call-to-Action */}
        <div>
          <p className="text-xs text-theme-secondary mb-2">
            See how humans sign "{query}" on YouTube:
          </p>
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors w-full justify-center shadow-sm"
          >
            Watch "{query}" on YouTube
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Suggested Channels */}
        <div className="pt-2 border-t border-theme-tertiary">
          <p className="text-[10px] uppercase tracking-wider font-bold text-theme-muted mb-2">
            Top Educational Channels
          </p>
          <div className="grid grid-cols-1 gap-2">
            {learningChannels.map(channel => (
              <a
                key={channel.name}
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-theme-tertiary transition-colors group"
              >
                <span className="text-xs text-theme-secondary group-hover:text-primary-600 transition-colors">
                  {channel.name}
                </span>
                <svg className="w-3 h-3 text-theme-muted group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningVideoSection;
