import React from 'react';
import {
  GithubIcon,
  TwitterIcon,
  PlatziIcon,
  LinkedinIcon,
  FigmaIcon,
  WhatsappIcon,
} from '../components/svg-icons';
import socialConfig from '../data/social.json';
import { trackEvent } from '../lib/analytics';

export default function SocialIcons({ config }) {
  const currentConfig = config || socialConfig;
  const links = currentConfig.links || socialConfig.links;
  const isDark = currentConfig.flags?.heroGradient === 'dark-blooker-amber';

  // Mapa de componentes SVG según la clave
  const iconMap = {
    whatsapp: <WhatsappIcon />,
    linkedin: <LinkedinIcon />,
    github: <GithubIcon />,
    platzi: <PlatziIcon />,
    twitter: <TwitterIcon />,
    figma: <FigmaIcon />,
  };

  const handleLinkClick = (key, item) => {
    trackEvent({
      action: `${key}_click`,
      category: 'social_link',
      label: `${item.name}: ${item.url}`,
      metadata: { network: key, destination: item.url },
    });
  };

  return (
    <div
      className={`flex justify-around items-center mx-auto w-full max-w-sm px-4 transition-all duration-300 ${
        isDark
          ? 'h-24 bg-white/15 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl shadow-black/50'
          : 'h-32'
      }`}
    >
      {Object.entries(links).map(([key, item]) => {
        if (!item?.enabled) return null;
        const iconComponent = iconMap[key];
        if (!iconComponent) return null;

        return (
          <a
            key={key}
            href={item.url}
            target='_blank'
            rel='noopener noreferrer'
            title={item.name}
            onClick={() => handleLinkClick(key, item)}
            className='transition-all duration-200 hover:scale-115 active:scale-95 flex items-center justify-center'
          >
            {iconComponent}
          </a>
        );
      })}
    </div>
  );
}
