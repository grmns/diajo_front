import React, { useState, useEffect, useRef } from 'react';
import { AutoComplete } from 'primereact/autocomplete';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useNavigate } from 'react-router-dom';
import axiosInstance from './axios';
import '../styles/formcompra.css';


function CrearCompra() {
    const [proveedores, setProveedores] = useState([]);
    const [sugerenciasProveedores, setSugerenciasProveedores] = useState([]);
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
    const [valorAutoComplete, setValorAutoComplete] = useState('');
    const toast = useRef(null);
    const navigate = useNavigate();
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
        proveedorSeleccionado: null,
        sugerenciasProveedores: []
    });

    useEffect(() => {
        axiosInstance.get('http://127.0.0.1:8000/compras/api/proveedores/')
            .then(response => {
                setProveedores(response.data);
            })
            .catch(error => console.error('Error al obtener proveedores:', error));
    }, []);

    const buscarProveedor = (evento) => {
        let query = evento.query.toLowerCase();
        let resultadosFiltrados = proveedores.filter(proveedor => {
            return proveedor.ruc.startsWith(query) || proveedor.razon_social.toLowerCase().includes(query);
        });
        setSugerenciasProveedores(resultadosFiltrados);
    };

    const onProveedorSelect = (e) => {
        setProveedorSeleccionado(e.value); // Asegúrate de que e.value es el proveedor completo
        setValorAutoComplete(e.value.razon_social); // Asume que quieres mostrar la razón social
    };

    const onProveedorChange = (e) => {
        setValorAutoComplete(e.value); // Esto maneja el texto ingresado para la búsqueda
        // Aquí podrías necesitar resetear proveedorSeleccionado si el texto cambia
        if (!e.value) {
            setProveedorSeleccionado(null);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCompra({ ...compra, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const formattedDate = date => date ? date.toISOString().split('T')[0] : null;
        const datosCompra = {
            tipo_documento: compra.tipo_documento,
            DCTO_N: compra.DCTO_N,
            MONEDA: compra.MONEDA,
            IMPORTE: parseFloat(compra.IMPORTE),
            PLAZO: parseInt(compra.PLAZO, 10),
            FECHA_EMISION: formattedDate(compra.FECHA_EMISION),
            RECEP_FT: formattedDate(compra.FECHA_RECEPCION),
            FECHA_VENCIMIENTO: formattedDate(compra.FECHA_VENCIMIENTO),
            CANCELADO: compra.CANCELADO ? 1 : 0,
            ANULADO: compra.ANULADO ? 1 : 0,
            OBSERVACION: compra.OBSERVACION,
            FECHA_PAGO: formattedDate(compra.FECHA_PAGO),
            MODO_PAGO: compra.MODO_PAGO,
            proveedor: proveedorSeleccionado ? proveedorSeleccionado.id_proveedor : null, // Asume que proveedorSeleccionado tiene un campo 'id'
        };

        axiosInstance.post('http://127.0.0.1:8000/compras/api/compras/', datosCompra)
            .then(response => {
                console.log('Compra creada con éxito', response);
                toast.current.show({ severity: 'success', summary: 'Compra creada', detail: 'La compra se ha registrado exitosamente', life: 3000 });
                setTimeout(() => {
                    navigate('/verCompras');  // Asegúrate de que la ruta es correcta
                }, 3200);
                // Manejo de éxito, como mostrar un mensaje o redireccionar
            })
            .catch(error => {
                console.error('Error al crear compra:', error.response.data);
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo crear la compra', life: 3000 });
                // Manejo de error, como mostrar un mensaje de error
            });
    };



    const tipoDocumentoOpciones = [
        { label: 'Factura', value: '1' },
        { label: 'Boleta', value: '2' },
        { label: 'Nota de crédito', value: '3' },
        { label: 'Nota de débito', value: '4' },
        { label: 'Otro', value: '5' }
    ];

    const monedaOpciones = [
        { label: 'Soles', value: 'S/' },
        { label: 'Dólares', value: 'USD' },
    ];

    const handlePlazoChange = (e) => {
        const newPlazo = e.value;
        setCompra(prevState => {
            const newFechaVencimiento = calculateFechaVencimiento(prevState.FECHA_RECEPCION, newPlazo);
            return { ...prevState, PLAZO: newPlazo, FECHA_VENCIMIENTO: newFechaVencimiento };
        });
    };

    const calculateFechaVencimiento = (fechaRecepcion, plazo) => {
        if (!fechaRecepcion) return null;
        const fecha = new Date(fechaRecepcion);
        fecha.setDate(fecha.getDate() + plazo);
        return fecha;
    };

    const handleFechaRecepcionChange = (e) => {
        const nuevaFechaRecepcion = e.value;
        const nuevaFechaVencimiento = calculateFechaVencimiento(nuevaFechaRecepcion, compra.PLAZO);
        setCompra(prevState => ({
            ...prevState,
            FECHA_RECEPCION: nuevaFechaRecepcion,
            FECHA_VENCIMIENTO: nuevaFechaVencimiento
        }));
    };

    const handleCanceladoChange = (e) => {
        const isChecked = e.checked;
        setCompra(prevState => ({
            ...prevState,
            CANCELADO: isChecked,
            FECHA_PAGO: isChecked ? new Date() : null
        }));
    };

    const modoPagoOpciones = [
        { label: 'Cheque', value: 'CHE' },
        { label: 'Letra', value: 'LE' },
        { label: 'Factoraje', value: 'FCT' },
        { label: 'Transacción Interbancaria', value: 'TI' },
        { label: 'Factura Negociable', value: 'DFN' },
        { label: 'Efectivo', value: 'EFE' },
    ];


    return (
        <div className="formulario-crear-compra">
            <Toast ref={toast} />
            <h2 className="titulo-formulario">Crear Nueva Compra</h2>
            <form onSubmit={handleSubmit} className="form-compra">
                <div className="form-group">
                    <label htmlFor="proveedor" className="form-label">Proveedor:</label>
                    <AutoComplete value={valorAutoComplete}
                        suggestions={sugerenciasProveedores}
                        completeMethod={buscarProveedor}
                        field="razon_social"
                        itemTemplate={(item) => `${item.ruc} - ${item.razon_social}`}
                        onSelect={onProveedorSelect}
                        onChange={onProveedorChange}
                        placeholder="Buscar proveedor por RUC o razón social"
                        className="p-inputtext-sm"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="tipo_documento" className="form-label">Tipo de Documento:</label>
                    <Dropdown inputId="tipo_documento"
                        value={compra.tipo_documento}
                        options={tipoDocumentoOpciones}
                        onChange={handleChange}
                        name="tipo_documento"
                        placeholder="Seleccione tipo de documento"
                        className="p-inputtext-sm"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="DCTO_N" className="form-label">Número de Documento:</label>
                    <InputText id="DCTO_N"
                        value={compra.DCTO_N}
                        onChange={handleChange}
                        name="DCTO_N"
                        placeholder="Ingrese número de documento"
                        className="p-inputtext-sm"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="MONEDA" className="form-label">Moneda:</label>
                    <Dropdown id="MONEDA"
                        value={compra.MONEDA}
                        options={monedaOpciones}
                        onChange={handleChange}
                        name="MONEDA"
                        placeholder="Seleccione moneda"
                        className="p-inputtext-sm"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="IMPORTE" className="form-label">Importe:</label>
                    <InputNumber id="IMPORTE"
                        value={compra.IMPORTE}
                        onValueChange={(e) => setCompra({ ...compra, IMPORTE: e.value })}
                        mode="decimal"
                        minFractionDigits={2}
                        maxFractionDigits={2}
                        placeholder="Ingrese importe"
                        tooltip="Ingrese el importe total"
                        className="p-inputtext-sm"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="PLAZO" className="form-label">Plazo (días):</label>
                    <InputNumber id="PLAZO"
                        value={compra.PLAZO}
                        onValueChange={handlePlazoChange}
                        integeronly
                        tooltip="Ingrese el número de días hasta el vencimiento"
                        className="p-inputtext-sm"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="FECHA_EMISION" className="form-label">Fecha de Emisión:</label>
                    <Calendar id="FECHA_EMISION"
                        value={compra.FECHA_EMISION}
                        onChange={(e) => setCompra({ ...compra, FECHA_EMISION: e.value })}
                        dateFormat="dd/mm/yy"
                        placeholder="Seleccione la fecha de emisión"
                        className="p-inputtext-sm"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="FECHA_RECEPCION" className="form-label">Fecha de Recepción:</label>
                    <Calendar id="FECHA_RECEPCION"
                        value={compra.FECHA_RECEPCION}
                        onChange={handleFechaRecepcionChange}
                        dateFormat="dd/mm/yy"
                        placeholder="Seleccione la fecha de recepción"
                        className="p-inputtext-sm"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="FECHA_VENCIMIENTO" className="form-label">Fecha de Vencimiento:</label>
                    <Calendar id="FECHA_VENCIMIENTO"
                        value={compra.FECHA_VENCIMIENTO}
                        readOnlyInput
                        disabled
                        dateFormat="dd/mm/yy"
                        placeholder="Fecha de vencimiento calculada"
                        className="p-inputtext-sm"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="CANCELADO" className="form-label">Cancelado:</label>
                    <Checkbox inputId="CANCELADO"
                        checked={compra.CANCELADO}
                        onChange={handleCanceladoChange}
                        className="p-checkbox"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="FECHA_PAGO" className="form-label">Fecha de Pago:</label>
                    <Calendar id="FECHA_PAGO"
                        value={compra.FECHA_PAGO}
                        onChange={(e) => setCompra({ ...compra, FECHA_PAGO: e.value })}
                        dateFormat="dd/mm/yy"
                        readOnlyInput
                        placeholder="Fecha de pago se establece al cancelar"
                        className="p-inputtext-sm"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="OBSERVACION" className="form-label">Observación:</label>
                    <InputTextarea id="OBSERVACION"
                        value={compra.OBSERVACION}
                        onChange={handleChange}
                        name="OBSERVACION"
                        autoResize
                        rows={5}
                        cols={30}
                        placeholder="Ingrese cualquier observación aquí"
                        className="p-inputtext-sm"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="MODO_PAGO" className="form-label">Modo de Pago:</label>
                    <Dropdown id="MODO_PAGO"
                        value={compra.MODO_PAGO}
                        options={modoPagoOpciones}
                        onChange={handleChange}
                        name="MODO_PAGO"
                        placeholder="Seleccione un modo de pago"
                        className="p-inputtext-sm"
                    />
                </div>
                <Button type="submit" label="Enviar Compra" className="p-button-success" style={{ width: '50%' }}></Button>
            </form>
        </div>
    );

}

export default CrearCompra;
