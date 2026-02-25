export function Testimonials() {
  const testimonials = [
    {
      body: 'La plataforma ha transformado nuestra gestión de exportaciones. Ahora tenemos control total sobre cada embarque.',
      author: {
        name: 'Exportadora del Valle',
        role: 'Sinaloa, MX',
        imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
    },
    {
      body: 'El portal de clientes nos ahorra horas de trabajo administrativo. Nuestros clientes descargan sus facturas directamente.',
      author: {
        name: 'Frutas Selectas',
        role: 'Michoacán, MX',
        imageUrl: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
    },
    {
      body: 'Cumplir con los requisitos del SAT y Anexo 24 nunca había sido tan sencillo. Altamente recomendado.',
      author: {
        name: 'AgroComercial del Norte',
        role: 'Sonora, MX',
        imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
    },
  ];

  return (
    <div id="testimonials" className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-lg font-semibold leading-8 tracking-tight text-hago-primary-600">Testimonios</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Confianza en el campo
          </p>
        </div>
        <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
          <div className="-mt-8 sm:-mx-4 sm:columns-2 sm:text-[0] lg:columns-3">
            {testimonials.map((testimonial) => (
              <div key={testimonial.author.name} className="pt-8 sm:inline-block sm:w-full sm:px-4">
                <figure className="rounded-2xl bg-white p-8 text-sm leading-6 shadow-sm ring-1 ring-gray-900/5 hover:shadow-md transition-shadow">
                  <blockquote className="text-gray-900 text-lg italic">
                    <p>{`"${testimonial.body}"`}</p>
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-x-4">
                    {/* <img className="h-10 w-10 rounded-full bg-gray-50" src={testimonial.author.imageUrl} alt="" /> */}
                    <div className="h-10 w-10 rounded-full bg-hago-primary-100 flex items-center justify-center text-hago-primary-700 font-bold">
                      {testimonial.author.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.author.name}</div>
                      <div className="text-gray-600">{testimonial.author.role}</div>
                    </div>
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
