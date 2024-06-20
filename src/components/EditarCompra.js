import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from './axios'; // Asegúrate de que esta ruta es correcta
import { Toast } from 'primereact/toast';
import { AutoComplete, Calendar, Dropdown, InputText, InputNumber, Checkbox, InputTextarea, Button } from 'primereact';
import '../styles/formcompra.css';

function EditarCompra() {
    const { id } = useParams();
    const [proveedores, setProveedores] = useState([]);
    const navigate = useNavigate();
    const toast = useRef(null);
    const [sugerenciasProveedores, setSugerenciasProveedores] = useState([]);
    const [compra, setCompra] = useState({
        tipo_documento: '',
        DCTO_N: '',
        MONEDA: '',
        IMPORTE: null,
        PLAZO: 0,
        FECHA_EMISION: null,
        FECHA_RECEPCION: null,
        FECHA_VENCIMIENTO: null,
        CANCELADO: false,
        FECHA_PAGO: null,
        OBSERVACION: '',
        MODO_PAGO: '',
        proveedor: null
    });

    // Simplificación de useEffect para cargar proveedores
    useEffect(() => {
        axiosInstance.get('http://127.0.0.1:8000/compras/api/proveedores/')
            .then(res => {
                const proveedoresOptions = res.data.map(prov => ({
                    label: `${prov.ruc} - ${prov.razon_social}`,
                    value: prov.id_proveedor
                }));
                setProveedores(proveedoresOptions);
            })
            .catch(error => console.error('Error al cargar proveedores:', error));
    }, []);

    // Actualización del proveedor seleccionado cuando se carga la compra
    useEffect(() => {
        if (id && proveedores.length > 0) {
            axiosInstance.get(`http://127.0.0.1:8000/compras/api/compras/${id}/`)
                .then(response => {
                    const data = response.data;
                    setCompra(data);
                    const proveedorActual = proveedores.find(p => p.value === data.proveedor);
                    if (proveedorActual) {
                        setBusquedaProveedor(proveedorActual.label);
                    }
                })
                .catch(error => console.error('Error al obtener la compra:', error));
        }
    }, [id, proveedores]);

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;
        if (type === 'checkbox') {
            setCompra({ ...compra, [name]: checked });
        } else {
            setCompra({ ...compra, [name]: value });
        }
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            ...compra,
            proveedor: compra.proveedor  // Asegúrate de que esto es un número (ID del proveedor).
        };

        axiosInstance.put(`http://127.0.0.1:8000/compras/api/compras/${id}/`, payload)
            .then(response => {
                toast.current.show({ severity: 'success', summary: 'Compra Actualizada', detail: 'Los detalles de la compra han sido actualizados correctamente.', life: 3000 });
                setTimeout(() => {
                    navigate('/verCompras');
                }, 3200);
            })
            .catch(error => {
                console.error('Error al actualizar la compra:', error.response ? error.response.data : error);
                toast.current.show({ severity: 'error', summary: 'Error al actualizar', detail: 'No se pudo actualizar la compra.', life: 3000 });
            });
    };







    const [busquedaProveedor, setBusquedaProveedor] = useState("");

    const buscarProveedor = (evento) => {
        axiosInstance.get(`http://127.0.0.1:8000/compras/api/proveedores/?search=${evento.query}`)
            .then(res => {
                const proveedoresOptions = res.data.map(prov => ({
                    label: `${prov.ruc} - ${prov.razon_social}`,
                    value: prov.id_proveedor
                }));
                setSugerenciasProveedores(proveedoresOptions);
            })
            .catch(error => console.error('Error al buscar proveedores:', error));
    };

    const onProveedorSelect = (e) => {
        setCompra(prev => ({
            ...prev,
            proveedor: e.value.value  // Asegura que solo se actualiza el ID del proveedor
        }));
        setBusquedaProveedor(e.value.label);  // Actualiza el valor visible en el input
    };






    const tipoDocumentoOpciones = [
        { label: 'Factura', value: 1 },
        { label: 'Boleta', value: 2 },
        { label: 'Nota de crédito', value: 3 },
        { label: 'Nota de débito', value: 4 },
        { label: 'Otro', value: 5 }
    ];

    const modoPagoOpciones = [
        { label: 'Cheque', value: 'CHE' },
        { label: 'Letra', value: 'LE' },
        { label: 'Factoraje', value: 'FCT' },
        { label: 'Transacción Interbancaria', value: 'TI' },
        { label: 'Factura Negociable', value: 'DFN' },
        { label: 'Efectivo', value: 'EFE' },
    ];

    return (
        <div className="formulario-editar-compra">
            <Toast ref={toast} />
            <h2 className="titulo-formulario">Editar Compra</h2>
            <form onSubmit={handleSubmit} className="form-compra">
                <div className="form-group">
                    <label htmlFor="proveedor" className="form-label">Proveedor:</label>
                    <AutoComplete
                        value={busquedaProveedor}
                        suggestions={sugerenciasProveedores}
                        completeMethod={buscarProveedor}
                        field="label"
                        forceSelection
                        itemTemplate={(item) => item.label}
                        onChange={onProveedorSelect}
                        onInputChange={(e) => setBusquedaProveedor(e.value)}
                        placeholder="Seleccione proveedor"
                        className="p-inputtext-sm"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="tipo_documento" className="form-label">Tipo de Documento:</label>
                    <Dropdown
                        value={compra.tipo_documento}
                        options={tipoDocumentoOpciones}
                        onChange={(e) => setCompra({ ...compra, tipo_documento: e.value })}
                        placeholder="Seleccione tipo de documento"
                        className="p-inputtext-sm"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="DCTO_N" className="form-label">Número de Documento:</label>
                    <InputText
                        id="DCTO_N"
                        value={compra.DCTO_N}
                        onChange={(e) => handleChange({ target: { name: 'DCTO_N', value: e.target.value } })}
                        placeholder="Ingrese número de documento"
                        className="p-inputtext-sm"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="MONEDA" className="form-label">Moneda:</label>
                    <Dropdown
                        id="MONEDA"
                        value={compra.MONEDA}
                        options={[{ label: 'Soles', value: 'S/' }, { label: 'Dólares', value: 'USD' }]}
                        onChange={(e) => handleChange({ target: { name: 'MONEDA', value: e.value } })}
                        placeholder="Seleccione moneda"
                        className="p-inputtext-sm"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="IMPORTE" className="form-label">Importe:</label>
                    <InputNumber
                        id="IMPORTE"
                        value={compra.IMPORTE}
                        onValueChange={(e) => handleChange({ target: { name: 'IMPORTE', value: e.value } })}
                        mode="currency"
                        currency="USD"
                        locale="en-US"
                        className="p-inputtext-sm"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="PLAZO" className="form-label">Plazo (días):</label>
                    <InputNumber
                        id="PLAZO"
                        value={compra.PLAZO}
                        onValueChange={(e) => handleChange({ target: { name: 'PLAZO', value: e.value } })}
                        integeronly
                        className="p-inputtext-sm"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="FECHA_EMISION" className="form-label">Fecha de Emisión:</label>
                    <Calendar
                        id="FECHA_EMISION"
                        value={new Date(compra.FECHA_EMISION)}
                        onChange={(e) => handleChange({ target: { name: 'FECHA_EMISION', value: e.value } })}
                        className="p-inputtext-sm"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="FECHA_VENCIMIENTO" className="form-label">Fecha de Vencimiento:</label>
                    <Calendar
                        id="FECHA_VENCIMIENTO"
                        value={new Date(compra.FECHA_VENCIMIENTO)}
                        onChange={(e) => handleChange({ target: { name: 'FECHA_VENCIMIENTO', value: e.value } })}
                        className="p-inputtext-sm"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="CANCELADO" className="form-label-checkbox">Cancelado</label>
                    <Checkbox
                        inputId="CANCELADO"
                        checked={compra.CANCELADO}
                        onChange={(e) => handleChange({ target: { name: 'CANCELADO', value: e.checked } })}
                        className="p-checkbox"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="OBSERVACION" className="form-label">Observación:</label>
                    <InputTextarea
                        id="OBSERVACION"
                        value={compra.OBSERVACION}
                        onChange={(e) => handleChange({ target: { name: 'OBSERVACION', value: e.target.value } })}
                        rows={3}
                        className="p-inputtext-sm"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="MODO_PAGO" className="form-label">Modo de Pago:</label>
                    <Dropdown
                        id="MODO_PAGO"
                        value={compra.MODO_PAGO}
                        options={modoPagoOpciones}
                        onChange={(e) => setCompra({ ...compra, MODO_PAGO: e.value })}
                        placeholder="Seleccione un modo de pago"
                        className="p-inputtext-sm"
                    />
                </div>
                <Button type="submit" label="Guardar Cambios" className="p-button-success" style={{ width: '50%' }} />
            </form>
        </div>
    );


}

export default EditarCompra;
