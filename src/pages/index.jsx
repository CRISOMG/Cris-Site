import Head from 'next/head';
import Link from 'next/link';
import SocialIcons from '../containers/SocialIcons';

export default function Home() {
  return (
    <div className='bg-page bg-gradient-to-b from-yellow-400 to-orange-500'>
      <Head>
        <title>Cris Page</title>
        <link rel='icon' href='/favicon.ico' />
        <meta key='title' name='title' content='Cristian Caraballo - Frontend Developer with React.js | Next.js ' />
        <meta
          key='description'
          name='description'
          content='Desarrollador de Aplicaciones FullStack MERN | Next.js | Nest.js. Tecnologías/Metodologías: MERN & JAM Stack. visita mi pagina para saber más...'
        />

        <meta key='og:type' property='og:type' content='website' />
        <meta key='og:url' property='og:url' content='https://cris-page.vercel.app/' />
        <meta
          key='og:title'
          property='og:title'
          content='Cristian Caraballo - FullStack MERN | Next.js | Nest.js '
        />
        <meta
          key='og:description'
          property='og:description'
          content='Desarrollador de Aplicaciones FullStack MERN | Next.js | Nest.js. Tecnologías/Metodologías: MERN & JAM Stack. visita mi pagina para saber más...'
        />
        <meta key='og:image' property='og:image' content='https://cris-page.vercel.app/assets/meta-image.png' />

        <meta key='twitter:card' property='twitter:card' content='summary_large_image' />
        <meta key='twitter:url' property='twitter:url' content='https://cris-page.vercel.app/' />
        <meta
          key='twitter:title'
          property='twitter:title'
          content='Cristian Caraballo - FullStack MERN | Next.js | Nest.js '
        />
        <meta
          key='twitter:description'
          property='twitter:description'
          content='Desarrollador de Aplicaciones FullStack MERN | Next.js | Nest.js. Tecnologías/Metodologías: MERN & JAM Stack. visita mi pagina para saber más...'
        />
        <meta
          key='twitter:image'
          property='twitter:image'
          content='https://cris-page.vercel.app/assets/meta-image.jpg'
        />
      </Head>

      <main className='flex flex-col justify-center items-center text-center p-4 min-h-screen'>
        <div className=''>
          <h2 className='_font-grand-hotel text-5xl'>Cristian</h2>
        </div>
        <div className='my-4'>
          <img
            width='240'
            height='240'
            className='mx-auto rounded-full w-60'
            src='/assets/cris-photo.jpg'
            alt='Cristian - Foto de perfil'
          />
        </div>
        <div className='text-center mb-4'>
          <h1 className='_font-grand-hotel text-5xl'>Javascript Developer</h1>
          <div className='flex ml-4'>
            <img
              className='object-contain -mb-1'
              width='25'
              height='25'
              src='/assets/platzi-icon.png'
              alt='platzi logo'
            />
            <h2 className='_font-arial text-2xl pt-2 italic'>Platzi Eternal Student</h2>
          </div>
          <h3 className='_font-nova-round font-bold italic text-xl '>Lifelong Learner</h3>
        </div>
        <SocialIcons />
        <div className='mt-2'>
          <Link
            href='/brand'
            className='inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/20 hover:bg-black/35 text-white text-sm font-semibold backdrop-blur-md transition-all hover:scale-105 border border-white/25 shadow-lg'
          >
            <span>✨ Manual de Marca & Propuesta de Valor</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </main>

      <style jsx>{`
        .bg-page {
        }

        ._font-grand-hotel {
          font-family: var(--grand-hotel);
        }
        ._font-arial {
          font-family: Arial, Helvetica, sans-serif;
        }
        ._font-nova-round {
          font-family: var(--nova-round);
        }
      `}</style>
    </div>
  );
}
