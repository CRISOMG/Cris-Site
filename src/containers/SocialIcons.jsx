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

export default function SocialIcons() {
  const { links } = socialConfig;

  // Mapa de componentes SVG según la clave
  const iconMap = {
    whatsapp: <WhatsappIcon />,
    linkedin: <LinkedinIcon />,
    github: <GithubIcon />,
    platzi: <PlatziIcon />,
    twitter: <TwitterIcon />,
    figma: <FigmaIcon />,
  };

  return (
    <div className='flex justify-around items-center mx-auto w-full max-w-sm h-32 px-2'>
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
            className='transition-all duration-200 hover:scale-115 active:scale-95 flex items-center justify-center'
          >
            {iconComponent}
          </a>
        );
      })}
    </div>
  );
}
