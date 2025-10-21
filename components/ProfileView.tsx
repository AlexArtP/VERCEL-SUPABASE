"use client"

import React, { useMemo, useState, useEffect, useRef } from "react"
import AppointmentCard from './AppointmentCard'
import dynamic from 'next/dynamic'
import { normalizeRun as normalizeRunHelper, formatWorkingHours as formatWorkingHoursHelper, formatDateTime as formatDateTimeHelper, validateProfile as validateProfileHelper } from '@/lib/profileHelpers'

// cargar el calendario únicamente en cliente para evitar errores en SSR
const ProfileCalendar = dynamic(() => import('./ProfileCalendar').then((m) => m.ProfileCalendar), { ssr: false })

import type { Usuario, Cita, Modulo } from "@/lib/demoData"

interface ProfileViewProps {
	professional: Usuario
	citas: Cita[]
	modulos?: Modulo[]
}

const normalizeRun = (r?: string) => normalizeRunHelper(r || '')
const ensureTime = (time = '00:00') => time.padStart(4, '0')
const formatRun = (run?: string) => {
    const s = normalizeRun(run)
    if (!s) return 'No informado'
    const dv = s.slice(-1)
    const nums = s.slice(0, -1)
    return nums.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv
}
const formatWorkingHours = (professional: Usuario) => formatWorkingHoursHelper(professional.workingHours?.start || '08:30', professional.workingHours?.end || '17:30')
const formatDateTime = (d: Date) => formatDateTimeHelper(d)
const formatTime = (d: Date) => d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

export function ProfileView({ professional, citas, modulos }: ProfileViewProps) {
	const primaryColor = professional.preferences?.primaryColor || '#3B82F6'

	// helper para colores similar a ProfileCalendar
	const getEventColors = (cita: Cita) => {
		const baseColor = cita.estado === 'confirmada' ? '#10b981' : cita.estado === 'pendiente' ? '#fbbf24' : '#94a3b8'
		const borderColor = cita.esSobrecupo ? '#ef4444' : baseColor
		const backgroundColor = cita.esSobrecupo ? '#fee2e2' : `${baseColor}22`
		return { baseColor, borderColor, backgroundColor }
	}

	// AppointmentCard externalizado en components/AppointmentCard.tsx

	// Estado 'now' y temporizador dinámico: recalcular justo cuando la próxima cita pase
	const [now, setNow] = useState<Date>(new Date())

	useEffect(() => {
		let timer: ReturnType<typeof setTimeout> | null = null

		// calcular citas del día (sin aplicar >= now)
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
		const tomorrow = new Date(todayStart)
		tomorrow.setDate(todayStart.getDate() + 1)

		const todays = (citas || [])
			.map((c) => ({ cita: c, date: new Date(`${c.fecha}T${ensureTime(c.hora)}:00`) }))
			.filter(({ date }) => !Number.isNaN(date.getTime()) && date >= todayStart && date < tomorrow)
			.sort((a, b) => a.date.getTime() - b.date.getTime())

		// próximas citas relativas a 'now'
		const upcoming = todays.filter(({ date }) => date.getTime() >= now.getTime())

		if (upcoming.length > 0) {
			// programar actualización justo cuando la próxima cita pase
			const msUntilNext = upcoming[0].date.getTime() - now.getTime()
			const delay = msUntilNext > 0 ? msUntilNext + 1000 : 1000 // si ya pasó, actualizar pronto
			timer = setTimeout(() => setNow(new Date()), delay)
		} else {
			// no hay próximas citas hoy (puede haber citas pasadas o no haber citas)
			// programar actualización al inicio del siguiente día para recargar la lista
			const msUntilTomorrow = tomorrow.getTime() - now.getTime() + 1000
			timer = setTimeout(() => setNow(new Date()), msUntilTomorrow)
		}

		return () => {
			if (timer) clearTimeout(timer)
		}
	}, [citas, now])

	// derivar las citas de hoy y las próximas dos según 'now'
	const { todaysAppointments = [], upcomingAppointments = [] } = useMemo(() => {
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
		const tomorrow = new Date(todayStart)
		tomorrow.setDate(todayStart.getDate() + 1)

		const todays = (citas || [])
			.map((c) => ({ cita: c, date: new Date(`${c.fecha}T${ensureTime(c.hora)}:00`) }))
			.filter(({ date }) => !Number.isNaN(date.getTime()) && date >= todayStart && date < tomorrow)
			.sort((a, b) => a.date.getTime() - b.date.getTime())

		const upcoming = todays.filter(({ date }) => date.getTime() >= now.getTime()).slice(0, 2)

		return { todaysAppointments: todays, upcomingAppointments: upcoming }
	}, [citas, now])

	const specialties = professional.specialties || []
	const description = professional.description || professional.cargo || ''

	const [editing, setEditing] = useState(false)
	const [mounted, setMounted] = useState(false)
	const defaultWorkingHours = professional.workingHours ?? { start: '08:30', end: '17:30' }
	const [local, setLocal] = useState<any>({
		id: professional.id,
		nombre: professional.nombre || '',
		apellidos: professional.apellidos || '',
		run: professional.run || '',
		profesion: professional.profesion || '',
		telefono: professional.telefono || '',
		email: professional.email || '',
		cargo: professional.cargo || professional.description || '',
		workingHours: defaultWorkingHours,
	})

	const saveProfile = async () => {
		const errs = validateProfileHelper(local)
		if (Object.keys(errs).length > 0) {
			alert('Errores en el formulario: ' + Object.values(errs).join(', '))
			return
		}
		const payload = { ...local, run: normalizeRun(local.run) }
		try {
			const res = await fetch('/api/profile', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
			if (!res.ok) throw new Error('API error')
			setEditing(false)
		} catch (err) {
			// fallback local
			try { localStorage.setItem('profile_' + local.id, JSON.stringify(payload)) } catch (e) {}
			alert('No fue posible guardar en el servidor. Perfil guardado localmente.')
			setEditing(false)
		}
	}

	useEffect(() => {
		setMounted(true)
	}, [])

	return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-3xl shadow-lg" style={{ background: `linear-gradient(135deg, ${primaryColor}, #1E3A8A)` }}>
				<div className="flex flex-col gap-6 px-6 py-8 text-white lg:flex-row lg:items-center">
						<div className="flex items-center gap-6">
							<div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-3xl font-semibold">
								{(professional.nombre || '').charAt(0)}{(professional.apellidos || '').charAt(0)}
							</div>
							<div>
								<h1 className="text-3xl font-bold lg:text-4xl">{professional.nombre} {professional.apellidos}</h1>
								<p className="mt-1 text-lg font-medium opacity-90">{local.profesion || professional.profesion || 'Profesional de la salud'}</p>
							</div>
						</div>
						<div className="ml-auto flex gap-3 items-center">
							<div className="rounded-xl bg-white/10 px-4 py-2 text-sm">RUN: {formatRun(professional.run)}</div>
							<div className="rounded-xl bg-white/10 px-4 py-2 text-sm">Horario: {formatWorkingHours(professional)}</div>
							<button onClick={() => setEditing(true)} className="ml-4 inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 rounded-md">Editar</button>
						</div>
					</div>
				</section>

				{editing && (
					<section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">Editar perfil</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<input value={local.nombre} onChange={(e) => setLocal({ ...local, nombre: e.target.value })} className="mt-1 w-full rounded border-gray-200 px-3 py-2" />
							<input value={local.apellidos} onChange={(e) => setLocal({ ...local, apellidos: e.target.value })} className="mt-1 w-full rounded border-gray-200 px-3 py-2" />
							<input value={local.run} onChange={(e) => setLocal({ ...local, run: e.target.value })} className="mt-1 w-full rounded border-gray-200 px-3 py-2" />
							<input value={local.profesion} onChange={(e) => setLocal({ ...local, profesion: e.target.value })} className="mt-1 w-full rounded border-gray-200 px-3 py-2" />
							<input value={local.telefono} onChange={(e) => setLocal({ ...local, telefono: e.target.value })} className="mt-1 w-full rounded border-gray-200 px-3 py-2" />
							<input value={local.email} onChange={(e) => setLocal({ ...local, email: e.target.value })} className="mt-1 w-full rounded border-gray-200 px-3 py-2" />
						</div>
						<div className="mt-4 flex items-center gap-3">
							<button onClick={saveProfile} className="rounded-md bg-blue-600 px-4 py-2 text-white">Guardar</button>
							<button onClick={() => setEditing(false)} className="rounded-md border border-gray-200 px-4 py-2">Cancelar</button>
						</div>
					</section>
				)}

						{/* Nuevo layout: Sobre el profesional (full width) */}
						<section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
							<h2 className="text-xl font-semibold text-gray-900">Sobre el profesional</h2>
							<p className="mt-4 text-gray-600">{description}</p>
							{specialties.length > 0 && (
								<div className="mt-6">
									<h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Especialidades</h3>
									<div className="mt-3 flex flex-wrap gap-2">
										{specialties.map((s) => (
											<span key={s} className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">{s}</span>
										))}
									</div>
								</div>
							)}
						</section>

						{/* Fila: Próximas citas (50%) | Información de contacto (50%) */}
						<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
							<div>
								<section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm h-full">
									<h2 className="mb-4 text-xl font-semibold text-gray-900">Próximas citas</h2>
									{/* Mostrar mensaje si no hay citas hoy */}
									{!mounted ? (
										<p className="text-sm text-gray-500">Cargando próximas citas...</p>
									) : todaysAppointments.length === 0 ? (
										<p className="text-sm text-gray-500">No hay citas programadas para hoy.</p>
									) : upcomingAppointments.length === 0 ? (
										<>
											<p className="text-sm text-gray-500">No quedan citas por venir hoy.</p>
											<ul className="mt-3 space-y-3 text-sm">
												{todaysAppointments.slice(0, 2).map(({ cita, date }) => (
													<li key={`past-${cita.id}`} className="rounded-xl border border-gray-100 bg-slate-50 p-3">
														<div className="flex items-center gap-3">
															<div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">{(cita.pacienteNombre || '').charAt(0)}</div>
															<div>
																<p className="font-medium text-gray-900">{cita.pacienteNombre}</p>
																<p className="text-xs uppercase tracking-wide text-gray-500">{cita.tipo}</p>
															</div>
														</div>
														<p className="mt-2 text-sm font-medium text-gray-700">{formatDateTime(date)}</p>
													</li>
												))}
											</ul>
										</>
									) : (
										<ul className="space-y-4 text-sm">
											{upcomingAppointments.map(({ cita, date }) => (
												<li key={cita.id} className="rounded-xl border border-gray-100 bg-slate-50 p-4">
													<div className="flex items-center gap-3">
														<div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">{(cita.pacienteNombre || '').charAt(0)}</div>
														<div>
															<p className="font-medium text-gray-900">{cita.pacienteNombre}</p>
															<p className="text-xs uppercase tracking-wide text-gray-500">{cita.tipo}</p>
														</div>
													</div>
													<p className="mt-4 text-sm font-medium text-gray-700">{formatDateTime(date)}</p>
													<p className="text-xs text-gray-500">Estado: {cita.esSobrecupo ? 'Sobrecupo' : cita.estado}</p>
												</li>
											))}
										</ul>
									)}
									{/* texto de actualización */}
									<p className="mt-3 text-xs text-gray-400">Actualizado a las {formatTime(now)}</p>
								</section>
							</div>

							<div>
								<section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm h-full">
									<h2 className="mb-4 text-xl font-semibold text-gray-900">Información de contacto</h2>
									<div className="space-y-4 text-sm text-gray-600">
										<div className="flex items-start gap-3">
											<div className="mt-0.5 h-5 w-5 text-blue-500" />
											<div>
												<p className="font-medium text-gray-800">Correo electrónico</p>
												<p>{professional.email || 'No informado'}</p>
											</div>
										</div>
										<div className="flex items-start gap-3">
											<div className="mt-0.5 h-5 w-5 text-blue-500" />
											<div>
												<p className="font-medium text-gray-800">Teléfono</p>
												<p>{professional.telefono || 'No informado'}</p>
											</div>
										</div>
										<div className="flex items-start gap-3">
											<div className="mt-0.5 h-5 w-5 text-blue-500" />
											<div>
												<p className="font-medium text-gray-800">Cargo actual</p>
												<p>{professional.cargo || 'No informado'}</p>
											</div>
										</div>
									</div>
								</section>
							</div>
						</div>

						{/* Calendario full-width debajo */}
						<div className="mt-6">
							<div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
								<ProfileCalendar citas={citas} modulos={modulos} primaryColor={primaryColor} />
							</div>
						</div>
		</div>
	)
}

