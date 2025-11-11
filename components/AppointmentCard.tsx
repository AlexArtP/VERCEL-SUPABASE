"use client"

import React, { useState, useRef, useEffect } from 'react'
import type { Cita } from '@/lib/demoData'
import { X } from 'lucide-react'

const formatDateTime = (d: Date) => d.toLocaleString('es-CL', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const formatTime = (d: Date) => d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

const getEventColors = (cita: Cita) => {
	const baseColor = cita.estado === 'confirmada' ? '#10b981' : cita.estado === 'pendiente' ? '#fbbf24' : '#94a3b8'
	const borderColor = cita.esSobrecupo ? '#ef4444' : baseColor
	const backgroundColor = cita.esSobrecupo ? '#fee2e2' : `${baseColor}22`
	return { baseColor, borderColor, backgroundColor }
}

interface Props {
	cita: Cita
	date: Date
}

export default function AppointmentCard({ cita, date }: Props) {
	const [showInfo, setShowInfo] = useState(false)
	const [showModal, setShowModal] = useState(false)
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const nodeRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current)
		}
	}, [])

	const { borderColor, backgroundColor } = getEventColors(cita)

	const nombreCompleto = cita.pacienteApellidos 
		? `${cita.pacienteNombre} ${cita.pacienteApellidos}` 
		: cita.pacienteNombre

	const onEnter = () => {
		if (timerRef.current) clearTimeout(timerRef.current)
		timerRef.current = setTimeout(() => setShowInfo(true), 300)
	}
	
	const onLeave = () => {
		if (timerRef.current) clearTimeout(timerRef.current)
		setShowInfo(false)
	}

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		console.log('🖱️ Click en cita:', cita)
		setShowModal(true)
	}

	return (
		<>
			<li className="relative cursor-pointer" onClick={handleClick}>
				<div
					ref={nodeRef}
					onMouseEnter={onEnter}
					onMouseLeave={onLeave}
					className="rounded-md text-sm leading-tight hover:shadow-md transition-shadow"
					style={{
						padding: '8px 10px',
						borderRadius: '8px',
						boxSizing: 'border-box',
						whiteSpace: 'normal',
						minHeight: '48px',
						width: '100%',
						border: `1.5px solid ${borderColor}`,
						background: backgroundColor,
					}}>
					<div className="flex items-center gap-2">
						<div className="h-7 w-7 rounded-full bg-white/50 flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ color: borderColor }}>{(nombreCompleto || '').charAt(0)}</div>
						<div className="flex-1 min-w-0">
							<p className="font-semibold text-gray-900 truncate text-sm">{nombreCompleto}</p>
							<p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
								<span>⏰</span>
								<span className="font-mono">{formatTime(date)}</span>
							</p>
						</div>
						{cita.esSobrecupo && <span className="text-xs font-bold text-red-600 flex-shrink-0">⚠️</span>}
					</div>
				</div>

				{showInfo && (
					<div className="absolute z-40 mt-1 max-w-xs rounded-lg border border-gray-300 bg-white p-3 shadow-xl text-sm transform transition-all duration-150 ease-out" style={{ right: 0, opacity: 1, transform: 'translateY(0)' }}>
						<div className="space-y-2">
							<div>
								<p className="font-bold text-gray-900">{nombreCompleto}</p>
								<p className="text-xs text-gray-600 mt-1">👤 {cita.tipo}</p>
							</div>
							<div className="pt-2 border-t border-gray-200">
								<p className="text-xs text-gray-700">
									<span className="font-semibold">⏰ {formatTime(date)}</span>
								</p>
								<p className="text-xs text-gray-600 mt-1">
									📋 Estado: <span className={cita.esSobrecupo ? 'text-red-600 font-semibold' : `${cita.estado === 'confirmada' ? 'text-green-600' : 'text-amber-600'} font-semibold`}>
										{cita.esSobrecupo ? '⚠️ Sobrecupo' : cita.estado === 'confirmada' ? '✓ Confirmada' : '⏳ Pendiente'}
									</span>
								</p>
							</div>
							{cita.observacion && (
								<div className="pt-2 border-t border-gray-200">
									<p className="text-xs font-semibold text-gray-700 mb-1">📝 Observaciones:</p>
									<p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{cita.observacion}</p>
								</div>
							)}
						</div>
					</div>
				)}
			</li>

			{/* Modal de detalles */}
			{showModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
					<div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
						{/* Header */}
						<div className="sticky top-0 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 flex items-center justify-between border-b border-gray-200">
							<h2 className="text-lg font-bold text-gray-900">Detalles de la Cita</h2>
							<button
								onClick={() => setShowModal(false)}
								className="p-1 hover:bg-blue-200 rounded-full transition-colors"
								title="Cerrar">
								<X className="w-5 h-5 text-gray-700" />
							</button>
						</div>

						{/* Contenido */}
						<div className="px-6 py-4 space-y-4">
						{/* Paciente */}
						<div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
							<p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">👤 Paciente</p>
							<p className="text-sm font-bold text-gray-900 mt-1">{nombreCompleto}</p>
						</div>							{/* Tipo de Cita */}
							<div className="bg-green-50 rounded-lg p-3 border border-green-200">
								<p className="text-xs font-semibold text-green-700 uppercase tracking-wide">📋 Tipo de Cita</p>
								<p className="text-sm font-bold text-gray-900 mt-1">{cita.tipo}</p>
							</div>

							{/* Fecha y Hora */}
							<div className="grid grid-cols-2 gap-3">
								<div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
									<p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">📅 Fecha</p>
									<p className="text-sm font-bold text-gray-900 mt-1">{formatDateTime(date).split(',')[0]}</p>
								</div>
								<div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
									<p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">⏰ Hora</p>
									<p className="text-sm font-bold text-gray-900 mt-1">{formatTime(date)}</p>
								</div>
							</div>

							{/* Estado */}
							<div className={`rounded-lg p-3 border ${
								cita.esSobrecupo 
									? 'bg-red-50 border-red-200' 
									: cita.estado === 'confirmada' 
									? 'bg-green-50 border-green-200' 
									: 'bg-yellow-50 border-yellow-200'
							}`}>
								<p className={`text-xs font-semibold uppercase tracking-wide ${
									cita.esSobrecupo 
										? 'text-red-700' 
										: cita.estado === 'confirmada' 
										? 'text-green-700' 
										: 'text-yellow-700'
								}`}>
									📊 Estado
								</p>
								<p className={`text-sm font-bold mt-1 ${
									cita.esSobrecupo 
										? 'text-red-900' 
										: cita.estado === 'confirmada' 
										? 'text-green-900' 
										: 'text-yellow-900'
								}`}>
									{cita.esSobrecupo ? '⚠️ Sobrecupo' : cita.estado === 'confirmada' ? '✓ Confirmada' : '⏳ Pendiente'}
								</p>
							</div>

							{/* Observaciones */}
							{cita.observacion && (
								<div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
									<p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">📝 Observaciones</p>
									<p className="text-sm text-gray-700 mt-2 bg-white rounded p-2">{cita.observacion}</p>
								</div>
							)}
							{!cita.observacion && (
								<div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
									<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">📝 Observaciones</p>
									<p className="text-sm text-gray-500 mt-2">Sin observaciones</p>
								</div>
							)}
						</div>

						{/* Footer */}
						<div className="sticky bottom-0 bg-gray-50 px-6 py-3 border-t border-gray-200 flex gap-2">
							<button
								onClick={() => setShowModal(false)}
								className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
								Cerrar
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	)
}
