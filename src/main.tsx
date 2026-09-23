import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.tsx'
import { GalleryProvider } from './context/GalleryContext.tsx'
import { EventProvider } from './context/EventContext.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'


const queryClient = new QueryClient()



createRoot(document.getElementById('root')!).render(

  <QueryClientProvider client={queryClient}>

    <BrowserRouter>

      <AuthProvider>

        <GalleryProvider>
          <EventProvider>
            <App />
          </EventProvider>
        </GalleryProvider>

      </AuthProvider>

    </BrowserRouter>

  </QueryClientProvider>

)
