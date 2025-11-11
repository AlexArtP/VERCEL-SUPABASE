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

	// Debug: log profesion
	useEffect(() => {
		// eslint-disable-next-line no-console
		console.log('[ProfileView] professional:', {
			id: professional.id,
			nombre: professional.nombre,
			profesion: (professional as any).profesion,
			apellido_paterno: (professional as any).apellido_paterno,
			apellido_materno: (professional as any).apellido_materno,
		})
	}, [professional.id])

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
	const [showMenu, setShowMenu] = useState(false)
	const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
	const [showDisableAgendaModal, setShowDisableAgendaModal] = useState(false)
	const [mounted, setMounted] = useState(false)
	const defaultWorkingHours = professional.workingHours ?? { start: '08:30', end: '17:30' }
	
	// Asegurar que profesion siempre tenga un valor desde la BD
	const profesionValue = (professional as any).profesion || ''
	
	const [local, setLocal] = useState<any>({
		id: professional.id,
		nombre: professional.nombre || '',
		apellido_paterno: (professional as any).apellido_paterno || '',
		apellido_materno: (professional as any).apellido_materno || '',
		run: professional.run || '',
		profesion: profesionValue,
		telefono: professional.telefono || '',
		email: professional.email || '',
		description: professional.description || professional.cargo || '',
		workingHours: defaultWorkingHours,
	})

	// Actualizar el estado local cuando cambia el profesional
	useEffect(() => {
		setLocal({
			id: professional.id,
			nombre: professional.nombre || '',
			apellido_paterno: (professional as any).apellido_paterno || '',
			apellido_materno: (professional as any).apellido_materno || '',
			run: professional.run || '',
			profesion: (professional as any).profesion || '',
			telefono: professional.telefono || '',
			email: professional.email || '',
			description: professional.description || professional.cargo || '',
			workingHours: defaultWorkingHours,
		})
	}, [professional.id, professional.nombre, professional.email, (professional as any).profesion])

	// Función para autoformatear RUN con guion antes del dígito verificador
	const formatRunInput = (value: string) => {
		const normalized = normalizeRun(value)
		if (!normalized || normalized.length < 2) return normalized
		const dv = normalized.slice(-1)
		const nums = normalized.slice(0, -1)
		return nums.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv
	}

	const handleRunChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const formatted = formatRunInput(e.target.value)
		setLocal({ ...local, run: formatted })
	}

	const saveProfile = async () => {
		const errs = validateProfileHelper(local)
		if (Object.keys(errs).length > 0) {
			alert('Errores en el formulario: ' + Object.values(errs).join(', '))
			return
		}
		// Construir payload solo con campos que existen en Supabase
		const payload = {
			id: local.id,
			nombre: local.nombre,
			apellido_paterno: local.apellido_paterno,
			apellido_materno: local.apellido_materno,
			run: normalizeRun(local.run),
			telefono: local.telefono,
			email: local.email,
		}
		try {
			const res = await fetch('/api/profile', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
			if (!res.ok) throw new Error('API error')
			// Actualizar estado local con la respuesta del servidor
			const updated = await res.json()
			// eslint-disable-next-line no-console
			console.log('[ProfileView] Respuesta del servidor:', updated)
			// Actualizar el estado local con los datos del servidor
			setLocal({
				id: updated.userid || updated.id || local.id,
				nombre: updated.nombre || local.nombre,
				apellido_paterno: updated.apellido_paterno || local.apellido_paterno,
				apellido_materno: updated.apellido_materno || local.apellido_materno,
				run: updated.run || local.run,
				profesion: updated.profesion || local.profesion,
				telefono: updated.telefono || local.telefono,
				email: updated.email || local.email,
			})
			// Disparar evento para que MainApp refresque la lista de usuarios
			window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updated }))
			setEditing(false)
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error('[ProfileView] Error guardando:', err)
			// fallback local
			try { localStorage.setItem('profile_' + local.id, JSON.stringify(payload)) } catch (e) {}
			alert('No fue posible guardar en el servidor. Perfil guardado localmente.')
			setEditing(false)
		}
	}

	// Cambiar contraseña usando nuevo endpoint Supabase
	const handleChangePassword = async (currentPassword: string, newPassword: string) => {
		try {
			// El profesional/usuario es el actual, obtenemos el email
			const userEmail = professional.email
			if (!userEmail) throw new Error('Email del usuario no disponible')

			const response = await fetch('/api/auth/change-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: userEmail,
					currentPassword,
					newPassword
				})
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Error al cambiar la contraseña')
			}

			alert('Contraseña actualizada correctamente')
			setShowChangePasswordModal(false)
		} catch (err: any) {
			console.error('Error cambiando contraseña:', err)
			alert(err?.message || 'No fue posible cambiar la contraseña')
		}
	}

	const handleDisableAgenda = async (reason: string) => {
		if (!reason || reason.trim().length < 3) {
			alert('Ingrese un motivo válido (mínimo 3 caracteres)')
			return
		}
		try {
			const payload = { id: professional.id, agendaDisabled: true, agendaDisabledReason: reason }
			const res = await fetch('/api/profile', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
			if (!res.ok) throw new Error('API error')
			alert('Agenda deshabilitada')
			setShowDisableAgendaModal(false)
			// actualizar estado local para que el calendario muestre el banner inmediatamente
			try {
				setLocal((prev: any) => ({ ...prev, agendaDisabled: true, agendaDisabledReason: reason }))
			} catch {}
			// intentar actualizar local storage fallback
			try {
				const raw = localStorage.getItem('profile_' + professional.id)
				if (raw) {
					const parsed = JSON.parse(raw)
					parsed.agendaDisabled = true
					parsed.agendaDisabledReason = reason
					localStorage.setItem('profile_' + professional.id, JSON.stringify(parsed))
				}
			} catch {}
		} catch (err) {
			console.error(err)
			alert('No fue posible persistir el cambio. Intenta nuevamente')
		}
	}

	useEffect(() => {
		setMounted(true)
	}, [])

		const isAgendaDisabled = (professional as any).agendaDisabled || false
		const agendaDisabledReason = (professional as any).agendaDisabledReason || ''

		// Combinar apellidos desde los campos separados de Supabase
		const apellidoPaterno = (professional as any).apellido_paterno || ''
		const apellidoMaterno = (professional as any).apellido_materno || ''
		const apellidosCompletos = `${apellidoPaterno} ${apellidoMaterno}`.trim()

		return (
		<div className="space-y-6">
			<section className="overflow-hidden rounded-3xl shadow-lg" style={{ background: `linear-gradient(135deg, ${primaryColor}, #1E3A8A)` }}>
				<div className="flex flex-col gap-6 px-6 py-8 text-white lg:flex-row lg:items-center">
						<div className="flex items-center gap-6">
							<div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-3xl font-semibold">
								{(professional.nombre || '').charAt(0)}{apellidosCompletos.charAt(0)}
							</div>
							<div>
								<h1 className="text-3xl font-bold lg:text-4xl">{professional.nombre} {apellidosCompletos}</h1>
								<p className="mt-1 text-lg font-medium opacity-90">{local.profesion || professional.profesion || 'Profesional de la salud'}</p>
							</div>
						</div>
						<div className="ml-auto flex gap-3 items-center">
							<div className="rounded-xl bg-white/10 px-4 py-2 text-sm">RUN: {formatRun(professional.run)}</div>
							<div className="rounded-xl bg-white/10 px-4 py-2 text-sm">Horario: {formatWorkingHours(professional)}</div>
							<div className="relative ml-4">
								<button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 rounded-md">Editar</button>
							</div>
							{/* Tres puntos: menú */}
							<div className="relative z-40">
								<button onClick={() => setShowMenu((s) => !s)} aria-label="Abrir opciones" className="ml-2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20">⋯</button>
								{showMenu && (
									<div className="absolute right-0 top-full mt-2 w-48 rounded-md bg-white shadow-2xl border border-gray-200 z-50">
										<button onClick={() => { setShowMenu(false); setShowChangePasswordModal(true); }} className="w-full text-left px-4 py-3 text-gray-900 hover:bg-gray-100 first:rounded-t-md">Cambiar contraseña</button>
										<button onClick={() => { setShowMenu(false); setShowDisableAgendaModal(true); }} className="w-full text-left px-4 py-3 text-gray-900 hover:bg-gray-100 last:rounded-b-md">Deshabilitar agenda</button>
									</div>
								)}
							</div>
						</div>
					</div>
				</section>

				{editing && (
					<section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">Editar perfil</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-900 mb-1">Nombre</label>
								<input value={local.nombre} onChange={(e) => setLocal({ ...local, nombre: e.target.value })} className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Nombre" />
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-900 mb-1">Apellido Paterno</label>
								<input value={local.apellido_paterno} onChange={(e) => setLocal({ ...local, apellido_paterno: e.target.value })} className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Apellido paterno" />
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-900 mb-1">Apellido Materno</label>
								<input value={local.apellido_materno} onChange={(e) => setLocal({ ...local, apellido_materno: e.target.value })} className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Apellido materno" />
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-900 mb-1">RUN</label>
								<input value={local.run} onChange={handleRunChange} className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="RUN" />
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-900 mb-1">Profesión</label>
								<input disabled value={local.profesion} className="w-full rounded border border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 placeholder-gray-500 cursor-not-allowed" />
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-900 mb-1">Teléfono</label>
								<input value={local.telefono} onChange={(e) => setLocal({ ...local, telefono: e.target.value })} className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Teléfono" />
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-900 mb-1">Email</label>
								<input value={local.email} onChange={(e) => setLocal({ ...local, email: e.target.value })} className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Email" />
							</div>
						</div>
						<div className="mt-4">
							<label className="block text-sm font-medium text-gray-900 mb-1">Sobre el profesional</label>
							<textarea value={local.description} onChange={(e) => setLocal({ ...local, description: e.target.value })} rows={4} className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Información sobre el profesional..." />
						</div>
						<div className="mt-4 flex items-center gap-3">
							<button onClick={saveProfile} className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">Guardar</button>
							<button onClick={() => setEditing(false)} className="rounded-md border border-gray-300 px-4 py-2 text-gray-900 hover:bg-gray-50">Cancelar</button>
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
												<ProfileCalendar
													citas={citas}
													modulos={modulos}
													primaryColor={primaryColor}
													agendaDisabled={isAgendaDisabled}
													agendaDisabledReason={agendaDisabledReason}
												/>
							</div>
						</div>

						{/* Modales simples */}
						{showChangePasswordModal && (
							<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
								<div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
									<h3 className="text-lg font-semibold mb-3 text-gray-900">Cambiar contraseña</h3>
									<ChangePasswordForm onCancel={() => setShowChangePasswordModal(false)} onSubmit={handleChangePassword} />
								</div>
							</div>
						)}

						{showDisableAgendaModal && (
							<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
								<div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
									<h3 className="text-lg font-semibold mb-3 text-gray-900">Deshabilitar agenda</h3>
									<p className="text-sm text-gray-600 mb-3">Indica el motivo por el cual deseas deshabilitar tu agenda. Este motivo será visible en el calendario.</p>
									<DisableAgendaForm onCancel={() => setShowDisableAgendaModal(false)} onSubmit={handleDisableAgenda} />
								</div>
							</div>
						)}
		</div>
	)
}

			// Componentes internos de formulario (pequeños, para mantener ProfileView limpio)
			function ChangePasswordForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (current: string, nw: string) => void }) {
				const [current, setCurrent] = useState('')
				const [nw, setNw] = useState('')
				const [confirm, setConfirm] = useState('')
				const [loading, setLoading] = useState(false)
				const handle = async (e: React.FormEvent) => {
					e.preventDefault()
					if (nw.length < 6) return alert('La nueva contraseña debe tener al menos 6 caracteres')
					if (nw !== confirm) return alert('La nueva contraseña y la confirmación no coinciden')
					try {
						setLoading(true)
						await onSubmit(current, nw)
					} finally { setLoading(false) }
				}
				return (
					<form onSubmit={handle} className="space-y-3">
						<div>
							<label className="block text-sm font-medium text-gray-900">Contraseña actual</label>
							<input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-900">Nueva contraseña</label>
							<input type="password" value={nw} onChange={(e) => setNw(e.target.value)} className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-900">Confirmar nueva contraseña</label>
							<input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
						</div>
						<div className="flex gap-2 justify-end">
							<button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded text-gray-900 hover:bg-gray-50">Cancelar</button>
							<button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">{loading ? 'Cambiando...' : 'Cambiar'}</button>
						</div>
					</form>
				)
			}

			function DisableAgendaForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (reason: string) => void }) {
				const [reason, setReason] = useState('')
				const [loading, setLoading] = useState(false)
				const handle = async (e: React.FormEvent) => {
					e.preventDefault()
					try {
						setLoading(true)
						await onSubmit(reason)
					} finally { setLoading(false) }
				}
				return (
					<form onSubmit={handle} className="space-y-3">
						<div>
							<label className="block text-sm font-medium text-gray-900">Motivo (visible en el calendario)</label>
							<textarea value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={4} />
						</div>
						<div className="flex gap-2 justify-end">
							<button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded text-gray-900 hover:bg-gray-50">Cancelar</button>
							<button type="submit" disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">{loading ? 'Procesando...' : 'Deshabilitar agenda'}</button>
						</div>
					</form>
				)
			}

