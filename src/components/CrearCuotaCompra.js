import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/formcompra.css';


function CuotaCompra() {
    const { compraId } = useParams();
    const navigate = useNavigate();
    const [cuotaDetails, setCuotaDetails] = useState({
        importe_cuota: '',
        fecha_emision: '',
        plazo: '',
        fecha_vencimiento: '',
        fecha_pago: '',
        numero_unico: '',
        observacion: ''
    });

    const [documentoNumero, setDocumentoNumero] = useState('');

    useEffect(() => {
        const fetchCompraDetails = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/compras/api/compras/${compraId}`);
                setDocumentoNumero(response.data.DCTO_N); // assuming the document number is stored in DCTO_N
            } catch (error) {
                console.error('Failed to fetch compra details:', error);
            }
        };

        fetchCompraDetails();

        if (cuotaDetails.fecha_emision && cuotaDetails.plazo) {
            const fechaEmision = new Date(cuotaDetails.fecha_emision);
            fechaEmision.setDate(fechaEmision.getDate() + parseInt(cuotaDetails.plazo));
            setCuotaDetails(prev => ({
                ...prev,
                fecha_vencimiento: fechaEmision.toISOString().split('T')[0]
            }));
        }
    }, [compraId, cuotaDetails.fecha_emision, cuotaDetails.plazo]);

    
    useEffect(() => {
        // Calculate Fecha de Vencimiento whenever Fecha de Emisión or Plazo changes
        if (cuotaDetails.fecha_emision && cuotaDetails.plazo) {
            const fechaEmision = new Date(cuotaDetails.fecha_emision);
            fechaEmision.setDate(fechaEmision.getDate() + parseInt(cuotaDetails.plazo));
            setCuotaDetails(prev => ({
                ...prev,
                fecha_vencimiento: fechaEmision.toISOString().split('T')[0] // Converts date to YYYY-MM-DD format
            }));
        }
    }, [cuotaDetails.fecha_emision, cuotaDetails.plazo]);

    const handleChange = (e) => {
        setCuotaDetails({ ...cuotaDetails, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const { importe_cuota, fecha_emision, plazo, fecha_vencimiento, fecha_pago, numero_unico, observacion } = cuotaDetails;
        try {
            const response = await axios.post('http://127.0.0.1:8000/compras/api/cuotas/', {
                compra: compraId,
                importe_cuota,
                fecha_emision,
                plazo,
                fecha_vencimiento,
                fecha_pago,
                numero_unico,
                observacion
            });
            console.log('Cuota created:', response.data);
            navigate('/cuotaCompra');
        } catch (error) {
            console.error('Failed to create cuota:', error);
        }
    };

    return (
        <div className="formulario-crear-compra">
            <h2 className="titulo-formulario">{`Crear Cuota de Compra ${documentoNumero ? `- ${documentoNumero}` : ''}`}</h2>
            <form onSubmit={handleSubmit} className="form-compra">
                <div className="form-group">
                    <label className="form-label">Importe de la Cuota</label>
                    <input
                        type="number"
                        name="importe_cuota"
                        className="p-inputtext"
                        value={cuotaDetails.importe_cuota}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Fecha de Emisión</label>
                    <input
                        type="date"
                        name="fecha_emision"
                        className="p-inputtext"
                        value={cuotaDetails.fecha_emision}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Plazo (días)</label>
                    <input
                        type="number"
                        name="plazo"
                        className="p-inputtext"
                        value={cuotaDetails.plazo}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Fecha de Vencimiento</label>
                    <input
                        type="date"
                        name="fecha_vencimiento"
                        className="p-inputtext"
                        value={cuotaDetails.fecha_vencimiento}
                        onChange={handleChange}
                        required
                        disabled
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Fecha de Pago</label>
                    <input
                        type="date"
                        name="fecha_pago"
                        className="p-inputtext"
                        value={cuotaDetails.fecha_pago}
                        onChange={handleChange}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Número Único</label>
                    <input
                        type="text"
                        name="numero_unico"
                        className="p-inputtext"
                        value={cuotaDetails.numero_unico}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Observación</label>
                    <textarea
                        name="observacion"
                        className="p-inputtext"
                        value={cuotaDetails.observacion}
                        onChange={handleChange}
                    />
                </div>
                <button type="submit" className="p-button">Crear Cuota</button>
            </form>
        </div>
    );
}

export default CuotaCompra;
