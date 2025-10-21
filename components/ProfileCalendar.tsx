"use client"

import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import esLocale from "@fullcalendar/core/locales/es"
import type { EventMountArg } from "@fullcalendar/core"
import type { Cita, Modulo } from "@/lib/demoData"
import { useState, useRef } from 'react'

interface ProfileCalendarProps {
	citas: Cita[]
	modulos?: Modulo[]
	primaryColor?: string
	// optional ref from parent to control the calendar API
	calendarRef?: any
}

const DEFAULT_EVENT_MINUTES = 45

const ensureTimeFormat = (time: string) => {
	if (!time) return "00:00"
	const parts = time.split(":")
	if (parts.length === 2) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`
	if (parts.length === 3) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`
	return "00:00"
}

const addMinutes = (date: Date, minutes: number) => {
	const copy = new Date(date)
	copy.setMinutes(copy.getMinutes() + minutes)
	return copy
}

const parseLocalDateTime = (dateStr: string, timeStr?: string) => {
 	// dateStr expected 'YYYY-MM-DD', timeStr expected 'HH:mm' or 'HH:mm:ss'
 	const [y, m, d] = (dateStr || '').split('-').map((n) => parseInt(n, 10))
 	let hour = 0
 	let minute = 0
 	if (timeStr) {
 		const parts = timeStr.split(':')
 		hour = parseInt(parts[0] || '0', 10)
 		minute = parseInt(parts[1] || '0', 10)
 	}
 	if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return new Date(NaN)
 	// Note: month is zero-based in Date constructor
 	return new Date(y, m - 1, d, hour, minute, 0, 0)
}

const buildEvents = (citas: Cita[], modulos?: Modulo[]) => {
 	return citas.map((cita) => {
 		const modulo = cita.moduloId ? modulos?.find((m) => m.id === cita.moduloId) : undefined
 		const start = parseLocalDateTime(cita.fecha, ensureTimeFormat(cita.hora))
 		let end: Date
 		if (modulo) {
 			// modulo may have horaFin or horaFin/horaInicio naming; try sensible fields
 			const horaFin = (modulo as any).horaFin || (modulo as any).horaFin || (modulo as any).horaFin
 			end = parseLocalDateTime(modulo.fecha, ensureTimeFormat(horaFin || (cita.hora)))
 		} else {
 			end = addMinutes(start, DEFAULT_EVENT_MINUTES)
 		}

 		// ensure valid dates
 		if (Number.isNaN(start.getTime())) {
 			console.warn('[ProfileCalendar] invalid start date for cita', cita)
 		}
 		if (Number.isNaN(end.getTime())) {
 			end = addMinutes(start, DEFAULT_EVENT_MINUTES)
 		}

 		const baseColor = cita.estado === 'confirmada' ? '#10b981' : cita.estado === 'pendiente' ? '#fbbf24' : '#94a3b8'
 		const borderColor = cita.esSobrecupo ? '#ef4444' : baseColor
 		const backgroundColor = cita.esSobrecupo ? '#fee2e2' : `${baseColor}22`

 		return {
 			id: `cita-${cita.id}`,
 			title: cita.pacienteNombre,
 			start,
 			end,
 			backgroundColor,
 			borderColor,
 			display: 'block' as const,
 			extendedProps: {
 				estado: cita.estado,
 				tipo: cita.tipo,
 				esSobrecupo: cita.esSobrecupo,
 			},
 		}
 	})
}

const isSameDay = (a?: Date, b?: Date) => {
	if (!a || !b) return false
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const isTodayOrTomorrow = (d?: Date) => {
	if (!d) return false
	const today = new Date()
	const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
	const tomorrow = new Date(t)
	tomorrow.setDate(t.getDate() + 1)
	return isSameDay(d, t) || isSameDay(d, tomorrow)
}

const hexToRgb = (hex: string) => {
	if (!hex) return null
	const h = hex.replace('#', '')
	const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16)
	return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 }
}

const getContrastColor = (bg: string) => {
	try {
		// support rgba or hex
		if (!bg) return '#111827'
		if (bg.startsWith('rgba') || bg.startsWith('rgb')) {
			const nums = bg.replace(/rgba?\(|\)|s/g, '').split(',').map(n=>parseFloat(n))
			const r = nums[0], g = nums[1], b = nums[2]
			const luminance = (0.299*r + 0.587*g + 0.114*b) / 255
			return luminance > 0.5 ? '#111827' : '#ffffff'
		}
		const rgb = hexToRgb(bg)
		if (!rgb) return '#111827'
		const { r, g, b } = rgb
		const luminance = (0.299*r + 0.587*g + 0.114*b) / 255
		return luminance > 0.5 ? '#111827' : '#ffffff'
	} catch (e) {
		return '#111827'
	}
}

export function ProfileCalendar({ citas, modulos, primaryColor, calendarRef }: ProfileCalendarProps) {
	const events = buildEvents(citas, modulos)
	// mostrar solo eventos del día de hoy cuando está activado el filtro 'Hoy'
	const filteredEvents = events.filter((ev) => isSameDay(ev.start as Date, new Date()))

	const [filteredOnly, setFilteredOnly] = useState(true)
	const internalRef = useRef<any>(null)
	const calRef = calendarRef ?? internalRef

	const baseColor = primaryColor || "#3B82F6"

	const headerToolbar = {
		left: "prev,next today",
		center: "title",
		right: "",
	}

	const views = {
		// usamos la vista estándar 'timeGridDay' para mostrar sólo hoy
	}


	// decidir si mostrar sábado: mostrar solo si hay eventos o módulos ese día
	const hasSaturdayEvent = events.some((ev) => {
		const s = ev.start as Date
		return s && !Number.isNaN(s.getTime()) && s.getDay() === 6
	})
	const hasSaturdayModulo = (modulos || []).some((m) => {
		const mStart = parseLocalDateTime((m as any).fecha || (m as any).fecha, ensureTimeFormat((m as any).horaInicio || (m as any).hora || ''))
		return mStart && !Number.isNaN(mStart.getTime()) && mStart.getDay() === 6
	})

	const hiddenDays = hasSaturdayEvent || hasSaturdayModulo ? [0] : [0, 6]

	return (
		<div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
			{/* estilos para atenuar el fondo del día actual y mejorar contraste */}
			<style>{`.fc .fc-day-today { background: rgba(15,23,42,0.03) !important; }
			.fc .fc-timegrid-col.fc-day-today { background: rgba(15,23,42,0.015) !important; }
			.fc .fc-daygrid-day.fc-day-today { background: rgba(15,23,42,0.02) !important; }
			.fc .fc-daygrid-day-number { color: inherit }`}</style>
			<div className="mb-4 flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold text-gray-900">Agenda semanal</h3>
					<p className="text-sm text-gray-500">Vista de las próximas citas programadas</p>
				</div>
				<div className="flex items-center gap-2">
							{/* estilo tipo pill azul */}
							<button onClick={() => {
								setFilteredOnly(true)
								setTimeout(() => calRef.current?.getApi().changeView('timeGridDay'), 50)
							}} className={`inline-flex items-center gap-3 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm ${filteredOnly ? 'ring-2 ring-blue-500' : ''}`}>
								<span>Hoy</span>
							</button>
					<button onClick={() => {
						setFilteredOnly(false)
						setTimeout(() => calRef.current?.getApi().changeView('timeGridWeek'), 50)
					}} className={`rounded-md px-3 py-1 text-sm ${!filteredOnly ? 'bg-blue-600 text-white' : 'border border-gray-200'}`}>Ver semana</button>
				</div>
			</div>
			<FullCalendar
				ref={calRef}
				plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
				locale={esLocale}
				initialView={filteredOnly ? "timeGridDay" : 'timeGridWeek'}
				views={views}
				height="auto"
				expandRows
				/* ocultar domingos para ahorrar espacio; sábado solo si hay eventos/modulos */
				hiddenDays={hiddenDays}
				/* evitar solapamiento lateral para que eventos ocupen todo el ancho de la franja */
				eventOverlap={false}
				/* también controlar solapamiento en slots */
				slotEventOverlap={false}
				nowIndicator
				selectable={false}
				editable={false}
				events={filteredOnly ? filteredEvents : events}
				eventDisplay="block"
				headerToolbar={headerToolbar}
				eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: false }}
				slotMinTime="07:00:00"
				slotMaxTime="21:00:00"
				eventDidMount={(info: EventMountArg) => {
					// clases base y mayor padding para mejor lectura
					info.el.classList.add("rounded-md", "text-sm", "leading-tight")
					info.el.style.padding = '6px 8px'
					info.el.style.borderRadius = '10px'
					info.el.style.boxSizing = 'border-box'
					info.el.style.whiteSpace = 'normal' // permitir wrapping
					info.el.style.minHeight = '36px'
					info.el.style.width = '100%'
					// aplicar color base si se pasa primaryColor
					info.el.style.borderColor = primaryColor ? `${baseColor}` : info.el.style.borderColor
					// si el evento tiene color de fondo, asegurar buen contraste de texto usando luminancia
					const bg = (info.event.backgroundColor as string) || info.el.style.backgroundColor
					const contrast = getContrastColor(bg)
					info.el.style.color = contrast

					// tooltip con delay 0.5s: crear listeners para mostrar info similar a AppointmentCard
					const showTooltip = (ev: MouseEvent) => {
						const el = info.el as HTMLElement
						// crear elemento tooltip
						const tip = document.createElement('div')
						tip.className = 'fc-tooltip absolute z-50 rounded-md border border-gray-200 bg-white p-3 shadow-lg text-sm'
						tip.style.minWidth = '180px'
						tip.innerHTML = `
							<p class="font-semibold text-gray-800">${info.event.title}</p>
							<p class="text-xs text-gray-500">${(info.event.extendedProps as any).tipo || ''} • Estado: ${((info.event.extendedProps as any).esSobrecupo ? 'Sobrecupo' : (info.event.extendedProps as any).estado || '')}</p>
							<p class="mt-2 text-xs text-gray-600">${new Date(info.event.start as Date).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})}</p>
						`

						document.body.appendChild(tip)
						// posicionar cerca del elemento
						const rect = el.getBoundingClientRect()
						tip.style.left = `${Math.min(rect.right - 10, window.innerWidth - 220)}px`
						tip.style.top = `${rect.top + window.scrollY + 8}px`

						;(el as any).__fc_tooltip = tip
					}

					const clearTooltip = (el: HTMLElement) => {
						const t = (el as any).__fc_tooltip
						if (t && t.parentNode) t.parentNode.removeChild(t)
						delete (el as any).__fc_tooltip
					}

					const enterHandler = (e: MouseEvent) => {
						if ((info.el as any).__fc_timer) (window as any).clearTimeout((info.el as any).__fc_timer)
						(info.el as any).__fc_timer = (window as any).setTimeout(() => showTooltip(e), 500)
					}
					const leaveHandler = () => {
						if ((info.el as any).__fc_timer) { (window as any).clearTimeout((info.el as any).__fc_timer); delete (info.el as any).__fc_timer }
						clearTooltip(info.el as HTMLElement)
					}

					info.el.addEventListener('mouseenter', enterHandler)
					info.el.addEventListener('mouseleave', leaveHandler)
					// guardar referencias para limpieza en eventWillUnmount
					;(info.el as any).__fc_handlers = { enterHandler, leaveHandler }
				}}
				eventWillUnmount={(info: EventMountArg) => {
					// limpiar tooltip y listeners
					const handlers = (info.el as any).__fc_handlers
					if (handlers) {
						info.el.removeEventListener('mouseenter', handlers.enterHandler)
						info.el.removeEventListener('mouseleave', handlers.leaveHandler)
						delete (info.el as any).__fc_handlers
					}
					if ((info.el as any).__fc_timer) { (window as any).clearTimeout((info.el as any).__fc_timer); delete (info.el as any).__fc_timer }
					const tip = (info.el as any).__fc_tooltip
					if (tip && tip.parentNode) tip.parentNode.removeChild(tip)
				}}
				dayHeaderClassNames="text-gray-600"
			/>
		</div>
	)
}
