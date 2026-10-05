import { EventItem } from '@/types/database'
import { Calendar as CalendarIcon, MapPin, Ticket } from 'lucide-react'
import { format, isPast } from 'date-fns'
import { es } from 'date-fns/locale'

interface EventsAgendaProps {
  events: EventItem[]
}

export function EventsAgenda({ events }: EventsAgendaProps) {
  // Filtrar eventos pasados si se desea, o mostrarlos atenuados. Aquí mostraremos futuros.
  const upcomingEvents = events
    .filter(e => !isPast(new Date(e.event_date)))
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <h3 className="text-xl font-bold px-2 flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-purple-400" />
        Próximas Fechas
      </h3>

      {upcomingEvents.length === 0 ? (
        <div className="glass-card p-8 rounded-2xl text-center border border-white/5 border-dashed">
          <p className="text-muted-foreground">Pronto anunciaremos nuevas fechas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingEvents.map((event) => {
            const dateObj = new Date(event.event_date)
            return (
              <div 
                key={event.id}
                className="glass-card p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border border-white/5 hover:border-white/20 transition-colors group"
              >
                <div className="flex gap-4 items-center">
                  <div className="flex flex-col items-center justify-center w-14 h-14 bg-white/5 rounded-xl border border-white/10 shrink-0">
                    <span className="text-xs font-semibold text-purple-400 uppercase leading-none mb-1">
                      {format(dateObj, 'MMM', { locale: es })}
                    </span>
                    <span className="text-lg font-bold leading-none">
                      {format(dateObj, 'dd')}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                      {event.title}
                    </h4>
                    {event.location && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {event.location}
                      </p>
                    )}
                  </div>
                </div>
                
                {event.ticket_url && (
                  <a 
                    href={event.ticket_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto mt-2 sm:mt-0 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Ticket className="w-4 h-4" />
                    Boletos
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
