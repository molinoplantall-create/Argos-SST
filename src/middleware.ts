import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // IMPORTANTE: Usar getUser() en lugar de getSession() para mayor seguridad.
  // getUser() valida el token contra el servidor de Supabase, no solo la cookie local.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Si el usuario NO está autenticado y trata de acceder a una ruta protegida
  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    // Guardamos la URL original para redirigir de regreso después del login
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si el usuario SÍ está autenticado y trata de acceder al login, lo enviamos al dashboard
  if (user && pathname.startsWith('/login')) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/';
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Aplica el middleware a todas las rutas excepto:
     * - _next/static  (archivos estáticos de Next.js)
     * - _next/image   (optimización de imágenes de Next.js)
     * - favicon.ico   (ícono de la pestaña)
     * - Archivos con extensión (png, jpg, svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
