import React, { useEffect, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { OverlayPanel } from "primereact/overlaypanel";
import { useAuth } from "../App"; // Importa el hook useAuth
import axiosInstance from "./axios"; // Importa axiosInstance en lugar de axios directamente
import "../styles/ventaslist.css";
import * as XLSX from 'xlsx';


function ComprasList() {
    const [compras, setCompras] = useState([]);
    const toast = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await axiosInstance.get("http://localhost:8000/compras/api/compras");
            const comprasData = response.data;

            // Obtener datos de proveedores para cada compra
            const comprasConProveedores = await Promise.all(
                comprasData.map(async (compra) => {
                    try {
                        const proveedorResponse = await axiosInstance.get(`http://localhost:8000/compras/api/proveedores/${compra.proveedor}`);
                        const proveedorData = proveedorResponse.data;
                        // Agregar los datos del proveedor a la compra
                        compra.rucProveedor = proveedorData.ruc;
                        compra.razonSocialProveedor = proveedorData.razon_social;
                    } catch (error) {
                        console.error("Error fetching proveedor data for compra:", error);
                    }
                    return compra;
                })
            );

            setCompras(comprasConProveedores);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const onGlobalFilterChange = (e) => {
        setGlobalFilter(e.target.value);
    };

    useAuth(); // Obtiene el estado de autenticación del contexto
    const navigate = useNavigate();
    const [selectedCompras, setSelectedCompras] = useState(null);
    const [globalFilter, setGlobalFilter] = useState("");
    const [fechaEmisionFiltro, setFechaEmisionFiltro] = useState(null);
    const [fechaRecepcionFiltro, setFechaRecepcionFiltro] = useState(null);
    const [fechaPagoFiltro, setFechaPagoFiltro] = useState(null);
    const [fechaVencimientoFiltro, setFechaVencimientoFiltro] = useState(null);
    const [toastActivo, setToastActivo] = useState(false);

    const formatoFecha = (fecha) => {
        if (!fecha) return '';
        const [year, month, day] = fecha.split('-');
        return `${day}-${month}-${year}`;
    };

    const TIPO_DOCUMENTO_OPCIONES = {
        1: 'Factura',
        2: 'Boleta',
        3: 'Nota de crédito',
        4: 'Nota de débito',
        5: 'Otro'
    };

    const tipoDocumentoTemplate = (rowData) => {
        const tipos = { 1: 'Factura', 2: 'Boleta', 3: 'Nota de crédito', 4: 'Nota de débito', 5: 'Otro' };
        return tipos[rowData.tipo_documento];
    };

    const tipoDocumentoOpciones = [
        { label: 'Factura', value: '1' },
        { label: 'Boleta', value: '2' },
        { label: 'Nota de crédito', value: '3' },
        { label: 'Nota de débito', value: '4' },
        { label: 'Otro', value: '5' }
    ];

    const tipoDocumentoFilterTemplate = (options) => {
        return (
            <Dropdown
                value={options.value}
                options={tipoDocumentoOpciones}
                onChange={(e) => options.filterCallback(e.value)}
                placeholder="Seleccionar tipo"
                className="p-column-filter"
                showClear
            />
        );
    };

    const monedas = [
        { label: 'Soles', value: 'S/' },
        { label: 'Dólares', value: 'USD' },
    ];

    const monedaFilterTemplate = (options) => {
        return (
            <Dropdown
                value={options.value}
                options={monedas}
                onChange={(e) => {
                    options.filterCallback(e.value);
                }}
                placeholder="Seleccionar moneda"
                className="p-column-filter"
                showClear
            />
        );
    };

    const modoPagoTemplate = (rowData) => {
        const modos = {
            'CHE': 'CHEQUE',
            'LE': 'LETRA',
            'FCT': 'FACTORING',
            'TI': 'TRANSACCION INTERBANCARIA',
            'DFN': 'FACTURA NEGOCIABLE',
            'EFE': 'EFECTIVO',
        };
        return modos[rowData.MODO_PAGO] || '';
    };

    const modosPagoOpciones = [
        { label: 'Cheque', value: 'CHE' },
        { label: 'Letra', value: 'LE' },
        { label: 'Factoring', value: 'FCT' },
        { label: 'Transacción interbancaria', value: 'TI' },
        { label: 'Descuento de factura negociable', value: 'DFN' },
        { label: 'Efectivo', value: 'EFE' },
    ];

    const modoPagoFilterTemplate = (options) => {
        return (
            <Dropdown
                value={options.value}
                options={modosPagoOpciones}
                onChange={(e) => {
                    options.filterCallback(e.value);
                }}
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar modo"
                className="p-column-filter"
                showClear
            />
        );
    };

    const observacionTemplate = (rowData) => rowData.OBSERVACION;



    const accionesTemplate = (rowData) => {
        return (
            <div className="p-grid p-justify-center">
                <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-success p-mr-2"
                    onClick={() => handleEdit(rowData)}
                    style={{ marginRight: '10px' }}
                />
                <Button
                    icon="pi pi-ban"
                    className="p-button-rounded p-button-danger"
                    onClick={() => handleAnular(rowData)}
                    style={{ marginRight: '10px' }}
                />
                {(rowData.MODO_PAGO === 'LE' || rowData.MODO_PAGO === 'DFN') && (
                    <Button
                        icon="pi pi-eye"
                        className="p-button-rounded p-button-info p-mr-2"
                        onClick={() => navigate(`/crearCuotaCompra/${rowData.id_compra}`)}
                    />
                )}

            </div>
        );
    };


    const filtrarCompras = () => {
        return compras.filter((compra) => {
            const tipoDocumento = typeof compra.tipo_documento === 'string' ? compra.tipo_documento : '';
            const fechaEmision = new Date(compra.FECHA_EMISION);
            const fechaRecepcion = new Date(compra.RECEP_FT);
            const fechaPago = new Date(compra.FECHA_PAGO);
            const fechaVencimiento = new Date(compra.FECHA_VENCIMIENTO);

            let estado;
            const hoy = new Date();
            if (compra.ANULADO) {
                estado = 'anulado';
            } else if (compra.CANCELADO) {
                estado = 'cancelado';
            } else if (fechaVencimiento < hoy) {
                estado = 'vencido';
            } else {
                estado = 'vigente';
            }

            return (
                (!anioSeleccionado || fechaEmision.getFullYear() === anioSeleccionado) &&
                (!mesSeleccionado || fechaEmision.getMonth() + 1 === mesSeleccionado) &&
                (!fechaEmisionFiltro || fechaEmision.toISOString().slice(0, 10) === fechaEmisionFiltro.toISOString().slice(0, 10)) &&
                (!fechaRecepcionFiltro || fechaRecepcion.toISOString().slice(0, 10) === fechaRecepcionFiltro.toISOString().slice(0, 10)) &&
                (!fechaPagoFiltro || fechaPago.toISOString().slice(0, 10) === fechaPagoFiltro.toISOString().slice(0, 10)) &&
                (!fechaVencimientoFiltro || fechaVencimiento.toISOString().slice(0, 10) === fechaVencimientoFiltro.toISOString().slice(0, 10)) &&
                (filters.tipo_documento.value === null || tipoDocumento.toLowerCase().includes(filters.tipo_documento.value.toLowerCase())) &&
                (filters.MONEDA.value === null || compra.MONEDA.toLowerCase().includes(filters.MONEDA.value.toLowerCase())) &&
                (filters.MODO_PAGO.value === null || compra.MODO_PAGO.toLowerCase().includes(filters.MODO_PAGO.value.toLowerCase())) &&
                (filters.rucProveedor.value === null || compra.rucProveedor.toLowerCase().includes(filters.rucProveedor.value.toLowerCase())) &&
                (filters.razonSocialProveedor.value === null || compra.razonSocialProveedor.toLowerCase().includes(filters.razonSocialProveedor.value.toLowerCase())) &&
                (filters.estadoCompra.value === null || estado === filters.estadoCompra.value.toLowerCase())
            );
        });
    };


    const FechaEmisionHeader = ({ fechaFiltro, setFechaFiltro }) => {
        const op = useRef(null);

        return (
            <div className="fecha-column-header">
                F. Emisión
                <Button
                    icon="pi pi-calendar"
                    className="p-button-text overlay-panel-icon"
                    onClick={(e) => op.current.toggle(e)}
                />
                <OverlayPanel ref={op} showCloseIcon id="overlay_panel" style={{ width: "auto" }}>
                    <Calendar value={fechaFiltro} onChange={(e) => setFechaFiltro(e.value)} inline showIcon dateFormat="yy-mm-dd" />
                </OverlayPanel>
            </div>
        );
    };

    const FechaRecepcionHeader = ({ fechaFiltro, setFechaFiltro }) => {
        const op = useRef(null);

        return (
            <div className="fecha-column-header">
                F. Recepción
                <Button
                    icon="pi pi-calendar"
                    className="p-button-text overlay-panel-icon"
                    onClick={(e) => op.current.toggle(e)}
                />
                <OverlayPanel ref={op} showCloseIcon id="overlay_panel_recepcion" style={{ width: 'auto' }}>
                    <Calendar value={fechaFiltro} onChange={(e) => setFechaFiltro(e.value)} inline showIcon dateFormat="yy-mm-dd" />
                </OverlayPanel>
            </div>
        );
    };

    const FechaVencimientoHeader = ({ fechaFiltro, setFechaFiltro }) => {
        const op = useRef(null);

        return (
            <div className="fecha-column-header">
                F. Vencimiento
                <Button
                    icon="pi pi-calendar"
                    className="p-button-text overlay-panel-icon"
                    onClick={(e) => op.current.toggle(e)}
                />
                <OverlayPanel ref={op} showCloseIcon id="overlay_panel_vencimiento" style={{ width: 'auto' }}>
                    <Calendar value={fechaFiltro} onChange={(e) => setFechaFiltro(e.value)} inline showIcon dateFormat="yy-mm-dd" locale='es' />
                </OverlayPanel>
            </div>
        );
    };

    const FechaPagoHeader = ({ fechaFiltro, setFechaFiltro }) => {
        const op = useRef(null);

        return (
            <div className="fecha-column-header">
                F. Pago
                <Button
                    icon="pi pi-calendar"
                    className="p-button-text overlay-panel-icon"
                    onClick={(e) => op.current.toggle(e)}
                />
                <OverlayPanel ref={op} showCloseIcon id="overlay_panel_pago" style={{ width: 'auto' }}>
                    <Calendar value={fechaFiltro} onChange={(e) => setFechaFiltro(e.value)} inline showIcon dateFormat="yy-mm-dd" />
                </OverlayPanel>
            </div>
        );
    };

    const confirmarAnulacion = (compra) => {
        console.log("Anular compra:", compra);
        toast.current.show({
            severity: "success",
            summary: "Compra anulada",
            detail: `Compra ${compra.id_compra} anulada correctamente`,
        });
        setToastActivo(true);
    };

    const handleAnular = (compra) => {
        confirmarAnulacion(compra);
    };

    const handleEdit = (compra) => {
        // Asegúrate de tener la ruta correcta configurada en tu sistema de rutas
        navigate(`/editarCompra/${compra.id_compra}`);
    };

    const [filters, setFilters] = useState({
        tipo_documento: { value: null, matchMode: "contains" },
        MONEDA: { value: null, matchMode: "contains" },
        MODO_PAGO: { value: null, matchMode: "contains" },
        rucProveedor: { value: null, matchMode: "contains" },
        razonSocialProveedor: { value: null, matchMode: "contains" },
        estadoCompra: { value: null, matchMode: 'equals' },
        DCTO_N: { value: null, matchMode: 'equals' }
    });

    const clearFilter = () => {
        setFilters({
            tipo_documento: { value: null, matchMode: "contains" },
            MONEDA: { value: null, matchMode: "contains" },
            MODO_PAGO: { value: null, matchMode: "contains" },
            rucProveedor: { value: null, matchMode: "contains" },
            razonSocialProveedor: { value: null, matchMode: "contains" },
            estadoCompra: { value: null, matchMode: 'equals' },
            DCTO_N: { value: null, matchMode: 'equals' }
        });
        setFechaEmisionFiltro(null);
        setFechaRecepcionFiltro(null);
        setFechaPagoFiltro(null);
        setFechaVencimientoFiltro(null);
        setMesSeleccionado(null);
        setAnioSeleccionado(null);
    };

    const opcionesMeses = [
        { label: "Enero", value: 1 },
        { label: "Febrero", value: 2 },
        { label: "Marzo", value: 3 },
        { label: "Abril", value: 4 },
        { label: "Mayo", value: 5 },
        { label: "Junio", value: 6 },
        { label: "Julio", value: 7 },
        { label: "Agosto", value: 8 },
        { label: "Septiembre", value: 9 },
        { label: "Octubre", value: 10 },
        { label: "Noviembre", value: 11 },
        { label: "Diciembre", value: 12 }
    ];

    const [mesSeleccionado, setMesSeleccionado] = useState(null);

    const actualizarDatos = () => {
        fetchData();
    };

    const [anioSeleccionado, setAnioSeleccionado] = useState(null);

    const opcionesAnios = [
        { label: '2020', value: 2020 },
        { label: '2021', value: 2021 },
        { label: '2022', value: 2022 },
        { label: '2023', value: 2023 },
        { label: '2024', value: 2024 },
        // Agrega más años según necesites
    ];


    const renderHeader = () => {
        return (
            <div className="table-header p-d-flex p-jc-between p-ai-center p-p-2">
                <Button
                    type="button"
                    icon="pi pi-refresh"
                    className="p-button-outlined p-mr-2"
                    onClick={actualizarDatos}
                />
                <Button
                    type="button"
                    label="Exportar a Excel"
                    icon="pi pi-file-excel"
                    className="p-button-success"
                    onClick={prepararExportacion} // This will change
                    style={{ marginRight: '.5em' }}
                />
                <Button
                    type="button"
                    icon="pi pi-filter-slash"
                    label="Limpiar"
                    className="p-button-outlined p-mr-2"
                    onClick={clearFilter}
                />
                <span className="p-input-icon-left p-flex-1 p-mr-2">
                    <i className="pi pi-search" />
                    <InputText
                        value={globalFilter}
                        onChange={onGlobalFilterChange}
                        placeholder="Búsqueda Global"
                    />
                </span>
                <Dropdown
                    value={mesSeleccionado}
                    options={opcionesMeses}
                    onChange={(e) => setMesSeleccionado(e.value)}
                    placeholder="Seleccionar Mes"
                    className="p-mr-2"
                />
                <Dropdown
                    value={anioSeleccionado}
                    options={opcionesAnios}
                    onChange={(e) => setAnioSeleccionado(e.value)}
                    placeholder="Seleccionar Año"
                    className="p-mr-2"
                />

            </div>
        );
    };

    const estadoOpciones = [
        { label: 'Anulado', value: 'Anulado' },
        { label: 'Cancelado', value: 'Cancelado' },
        { label: 'Vencido', value: 'Vencido' },
        { label: 'Vigente', value: 'Vigente' }
    ];

    const estadoFilterTemplate = (options) => {
        return (
            <Dropdown
                value={options.value}
                options={estadoOpciones}
                onChange={(e) => options.filterCallback(e.value)}
                placeholder="Seleccionar estado"
                className="p-column-filter"
                showClear
            />
        );
    };

    const estadoCompraTemplate = (rowData) => {
        let estado;
        const hoy = new Date();

        if (rowData.ANULADO) {
            estado = 'Anulado';
        } else if (rowData.CANCELADO) {
            estado = 'Cancelado';
        } else if (new Date(rowData.FECHA_VENCIMIENTO) < hoy) {
            estado = 'Vencido';
        } else {
            estado = 'Vigente';
        }

        return (
            <span className={`compra-estado ${estado.toLowerCase()}`}>
                {estado}
            </span>
        );
    };

    const prepararExportacion = () => {
        if (toast.current) {
            toast.current.show({
                severity: 'success',
                summary: 'Confirmación',
                detail: '¿Deseas exportar las ventas filtradas a Excel?',
                life: 6000,
                content: () => (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <div style={{ color: 'black' }}>¿Estás seguro de que quieres exportar los datos filtrados a Excel?</div>
                        <div>
                            <Button label="Confirmar" icon="pi pi-check" onClick={realizarExportacion} className="p-button-raised p-button-success p-mr-2" style={{ marginRight: '10px' }} />
                            <Button label="Cancelar" icon="pi pi-times" onClick={() => toast.current.clear()} className="p-button-raised p-button-danger p-ml-2" />
                        </div>
                    </div>
                ),
                sticky: true
            });
        }
    };

    const realizarExportacion = () => {
        toast.current.clear();
        try {
            const datosParaExportar = filtrarCompras().map(compra => ({
                'ID Compra': compra.id_compra,
                'Proveedor': compra.razonSocialProveedor,
                'RUC Proveedor': compra.rucProveedor,
                'Tipo Documento': TIPO_DOCUMENTO_OPCIONES[compra.tipo_documento] || compra.tipo_documento,
                'Número Documento': compra.DCTO_N,
                'Moneda': compra.MONEDA,
                'Importe': compra.IMPORTE,
                'Plazo': compra.PLAZO,
                'Fecha Emisión': compra.FECHA_EMISION,
                'Fecha Recepción': compra.RECEP_FT,
                'Fecha Vencimiento': compra.FECHA_VENCIMIENTO,
                'Estado': determinarEstadoCompra(compra), // Asumiendo que tienes una función para calcular esto
                'Observación': compra.OBSERVACION || "",
                'Fecha Pago': compra.FECHA_PAGO,
                'Modo de Pago': compra.MODO_PAGO
            }));

            const worksheet = XLSX.utils.json_to_sheet(datosParaExportar);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Compras');
            XLSX.writeFile(workbook, `Compras_${new Date().toLocaleDateString()}.xlsx`);

            toast.current.show({
                severity: 'success',
                summary: 'Exportación completada',
                detail: 'Los datos han sido exportados a Excel correctamente.',
                life: 3000
            });
        } catch (error) {
            console.error('Error al exportar a Excel:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Error de Exportación',
                detail: 'Hubo un problema al exportar los datos.',
                life: 3000
            });
        }
    };

    const determinarEstadoCompra = (compra) => {
        const hoy = new Date();
        if (compra.ANULADO) {
            return 'Anulado';
        } else if (compra.CANCELADO) {
            return 'Cancelado';
        } else if (new Date(compra.FECHA_VENCIMIENTO) < hoy) {
            return 'Vencido';
        } else {
            return 'Vigente';
        }
    };

    return (
        <div className="compras-list-container">
            <Toast ref={toast} onRemove={() => setToastActivo(false)} />
            <div className="card">
                <h2>Lista de Compras</h2>
                <DataTable
                    value={filtrarCompras()}
                    onSelectionChange={(e) => { }}
                    rowClassName={(data) => (data.ANULADO ? "fila-anulada" : "")}
                    dataKey="id_compra"
                    removableSort
                    paginator
                    rows={50}
                    rowsPerPageOptions={[50, 100, 150, 200]}
                    header={renderHeader()}
                    globalFilter={globalFilter}
                    filters={filters}
                >
                    <Column field="id_compra" header="ID" sortable />
                    <Column
                        field="rucProveedor"
                        header="RUC"
                        filter
                        filterPlaceholder="Buscar por RUC"
                    />
                    <Column
                        field="razonSocialProveedor"
                        header="Proveedor"
                        filter
                        filterPlaceholder="Buscar por Proveedor"
                    />
                    <Column
                        field="tipo_documento"
                        header="Tipo Documento"
                        body={tipoDocumentoTemplate}
                        filter
                        filterElement={tipoDocumentoFilterTemplate}
                    />
                    <Column
                        field="DCTO_N"
                        header="N° Documento"
                        filter
                        filterPlaceholder="Buscar por Documento"
                    />
                    <Column
                        field="MONEDA"
                        header="Moneda"
                        body={(rowData) => rowData.MONEDA}
                        filter
                        filterElement={monedaFilterTemplate}
                    />
                    <Column field="IMPORTE" header="Importe" sortable />
                    <Column field="PLAZO" header="Plazo" sortable />
                    <Column
                        field="FECHA_EMISION"
                        header={
                            <FechaEmisionHeader
                                fechaFiltro={fechaEmisionFiltro}
                                setFechaFiltro={setFechaEmisionFiltro}
                            />
                        }
                        body={(rowData) => formatoFecha(rowData.FECHA_EMISION)}
                    />
                    <Column
                        field="RECEP_FT"
                        header={
                            <FechaRecepcionHeader
                                fechaFiltro={fechaRecepcionFiltro}
                                setFechaFiltro={setFechaRecepcionFiltro}
                            />
                        }
                        body={(rowData) => formatoFecha(rowData.RECEP_FT)}
                    />
                    <Column
                        field="FECHA_VENCIMIENTO"
                        header={
                            <FechaVencimientoHeader
                                fechaFiltro={fechaVencimientoFiltro}
                                setFechaFiltro={setFechaVencimientoFiltro}
                            />
                        }
                        body={(rowData) => formatoFecha(rowData.FECHA_VENCIMIENTO)}
                    />
                    <Column
                        field="OBSERVACION"
                        header="Observación"
                        body={observacionTemplate}
                    />
                    <Column
                        field="estadoCompra"
                        header="Estado"
                        body={estadoCompraTemplate}
                        filter
                        filterElement={estadoFilterTemplate}
                    />
                    <Column
                        field="FECHA_PAGO"
                        header={
                            <FechaPagoHeader
                                fechaFiltro={fechaPagoFiltro}
                                setFechaFiltro={setFechaPagoFiltro}
                            />
                        }
                        body={(rowData) => formatoFecha(rowData.FECHA_PAGO)}
                    />
                    <Column
                        field="MODO_PAGO"
                        header="Modo de Pago"
                        body={modoPagoTemplate}
                        filter
                        filterElement={modoPagoFilterTemplate}
                    />
                    <Column body={accionesTemplate} />
                </DataTable>
            </div>
        </div>
    );
}

export default ComprasList;
