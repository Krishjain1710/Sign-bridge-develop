import React from 'react';
import { usePanel } from '../contexts/PanelContext';

const LearningHub: React.FC = () => {
  const { closePanel } = usePanel();

  const resources = [
    {
      title: 'YouTube Learning Channels',
      description: 'The best channels to learn American Sign Language (ASL) for free.',
      items: [
        { name: 'Bill Vicars (ASL University)', url: 'https://www.youtube.com/@billvicars', icon: '🎓' },
        { name: 'ASL Meredith', url: 'https://www.youtube.com/@ASLMeredith', icon: '📺' },
        { name: 'Signed with Courtney', url: 'https://www.youtube.com/@SignedWithCourtney', icon: '✨' },
        { name: 'Learn How to Sign', url: 'https://www.youtube.com/@LearnHowToSign', icon: '👐' }
      ]
    },
    {
      title: 'Online Dictionaries',
      description: 'Search for specific signs and variations.',
      items: [
        { name: 'Handspeak', url: 'https://www.handspeak.com/', icon: '📖' },
        { name: 'ASL Core', url: 'https://aslcore.org/', icon: '🔍' },
        { name: 'Spread the Sign', url: 'https://www.spreadthesign.com/', icon: '🌎' }
      ]
    },
    {
      title: 'Learning Strategies',
      description: 'Methods to help you master signing faster.',
      items: [
        { name: 'Total Physical Response', description: 'Signing while speaking for better memory.', icon: '🧠' },
        { name: 'The Mirror Method', description: 'Practice signs in a mirror to check hand shapes.', icon: '🪞' },
        { name: 'Visual Immersion', description: 'Watch ASL videos without subtitles to build focus.', icon: '👀' }
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full bg-theme-primary">
      <div className="p-4 border-b border-theme-primary flex items-center justify-between sticky top-0 bg-theme-primary z-10">
        <div>
          <h2 className="text-lg font-bold text-theme-primary">Learning Hub</h2>
          <p className="text-xs text-theme-muted">Master Sign Language with curated resources</p>
        </div>
        <button
          onClick={closePanel}
          className="p-2 rounded-lg hover:bg-theme-secondary transition-colors"
          aria-label="Close panel"
        >
          <svg className="w-5 h-5 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="space-y-8">
          {resources.map((section, idx) => (
            <section key={idx}>
              <h3 className="text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1 px-1">
                {section.title}
              </h3>
              <p className="text-xs text-theme-muted mb-4 px-1">{section.description}</p>
              
              <div className="grid grid-cols-1 gap-3">
                {section.items.map((item, i) => (
                  <div key={i}>
                    {'url' in item ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-3 rounded-xl bg-theme-secondary border border-theme-primary hover:border-primary-500/50 hover:bg-theme-tertiary transition-all group"
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-theme-primary group-hover:text-primary-600 transition-colors">
                            {item.name}
                          </h4>
                          <p className="text-[10px] text-theme-muted">Visit External Resource</p>
                        </div>
                        <svg className="w-4 h-4 text-theme-muted group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ) : (
                      <div className="flex items-start gap-4 p-3 rounded-xl bg-theme-secondary/50 border border-theme-tertiary">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <h4 className="text-sm font-semibold text-theme-primary">{item.name}</h4>
                          <p className="text-xs text-theme-secondary leading-relaxed mt-1">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Community Section */}
        <div className="mt-12 p-6 rounded-2xl gradient-teal text-white shadow-lg">
          <h3 className="text-lg font-bold mb-2">Want to practice?</h3>
          <p className="text-sm text-white/80 mb-4 leading-relaxed">
            Record yourself signing and compare it with the 3D avatar or real signers on YouTube. Repetition is the secret to muscle memory!
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={closePanel}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold transition-colors"
            >
              Start New Translation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningHub;
