"use client"

import React, { useState, useRef, useEffect } from 'react'
import type { Cita } from '@/lib/demoData'

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
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const nodeRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current)
		}
	}, [])

	const { borderColor, backgroundColor } = getEventColors(cita)

	const onEnter = () => {
		if (timerRef.current) clearTimeout(timerRef.current)
		timerRef.current = setTimeout(() => setShowInfo(true), 500)
	}
	const onLeave = () => {
		if (timerRef.current) clearTimeout(timerRef.current)
		setShowInfo(false)
	}

	return (
		<li className="relative">
			<div
				ref={nodeRef}
				onMouseEnter={onEnter}
				onMouseLeave={onLeave}
				className="rounded-md text-sm leading-tight"
				style={{
					padding: '8px 10px',
					borderRadius: '10px',
					boxSizing: 'border-box',
					whiteSpace: 'normal',
					minHeight: '44px',
					width: '100%',
					border: `1px solid ${borderColor}`,
					background: backgroundColor,
				}}>
				<div className="flex items-center gap-3">
					<div className="h-8 w-8 rounded-full bg-white/40 flex items-center justify-center text-sm font-semibold" style={{ color: borderColor }}>{(cita.pacienteNombre || '').charAt(0)}</div>
					<div>
						<p className="font-medium text-gray-900">{cita.pacienteNombre}</p>
						<p className="text-xs uppercase tracking-wide text-gray-500">{cita.tipo}</p>
					</div>
				</div>
				<p className="mt-2 text-sm font-medium text-gray-700">{formatTime(date)} • {formatDateTime(date)}</p>
			</div>

			{showInfo && (
				<div className="absolute z-50 mt-2 max-w-xs rounded-md border border-gray-200 bg-white p-3 shadow-lg text-sm transform transition-all duration-150 ease-out" style={{ right: 0, opacity: 1, transform: 'translateY(0)' }}>
					<p className="font-semibold text-gray-800">{cita.pacienteNombre}</p>
					<p className="text-xs text-gray-500">{cita.tipo} • Estado: {cita.esSobrecupo ? 'Sobrecupo' : cita.estado}</p>
					<p className="mt-2 text-xs text-gray-600">Hora: {formatTime(date)}</p>
				</div>
			)}
		</li>
	)
}
