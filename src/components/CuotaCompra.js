import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import * as XLSX from 'xlsx';
import "../styles/ventaslist.css";

function CuotaCompra() {
    const [cuotas, setCuotas] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [mesSeleccionado, setMesSeleccionado] = useState(null);
    const [anioSeleccionado, setAnioSeleccionado] = useState(null);
    const [toastActivo, setToastActivo] = useState(false);
    const dataTableRef = useRef(null);
    const toast = useRef(null);

    const fetchData = () => {
        axios.get('http://127.0.0.1:8000/compras/api/cuotas/')
            .then(response => {
                const cuotasData = response.data;
                const compraIds = cuotasData.map(cuota => cuota.compra);
                const uniqueCompraIds = [...new Set(compraIds)];

                Promise.all(uniqueCompraIds.map(id =>
                    axios.get(`http://127.0.0.1:8000/compras/api/compras/${id}/`)
                )).then(comprasResponses => {
                    const compras = comprasResponses.map(res => res.data);
                    const proveedorIds = compras.map(compra => compra.proveedor);
                    const uniqueProveedorIds = [...new Set(proveedorIds)];
                    Promise.all(uniqueProveedorIds.map(id =>
                        axios.get(`http://127.0.0.1:8000/compras/api/proveedores/${id}/`)
                    )).then(proveedoresResponses => {
                        const proveedores = proveedoresResponses.map(res => res.data);
                        const pagosPorCompra = cuotasData.reduce((acc, cuota) => {
                            acc[cuota.compra] = (acc[cuota.compra] || 0) + parseFloat(cuota.importe_cuota);
                            return acc;
                        }, {});

                        const cuotasConCompras = cuotasData.map(cuota => {
                            const compra = compras.find(compra => compra.id_compra === cuota.compra);
                            const totalPagado = pagosPorCompra[cuota.compra];
                            const importeRestante = (compra.IMPORTE - totalPagado).toFixed(2);
                            return {
                                ...cuota,
                                compraData: compra,
                                proveedorData: proveedores.find(prov => prov.id_proveedor === compra.proveedor),
                                importeRestante: importeRestante
                            };
                        });
                        setCuotas(cuotasConCompras);
                    });
                });
            })
            .catch(error => console.error('Error al obtener las cuotas:', error));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatoFecha = (fecha) => {
        if (!fecha) return '';
        const [year, month, day] = fecha.split('-');
        return `${day}-${month}-${year}`;
    };

    const monedaOpciones = [
        { label: 'Soles', value: 'S/' },
        { label: 'Dolares', value: 'USD' }
    ];

    const monedaFilterTemplate = (options) => {
        return (
            <Dropdown
                style={{ width: '100%' }}
                value={options.value}
                options={monedaOpciones}
                onChange={(e) => {
                    options.filterCallback(e.value);
                }}
                placeholder="Seleccionar moneda"
                showClear
            />
        );
    };

    const opcionesMeses = [
        { label: 'Enero', value: 1 },
        { label: 'Febrero', value: 2 },
        { label: 'Marzo', value: 3 },
        { label: 'Abril', value: 4 },
        { label: 'Mayo', value: 5 },
        { label: 'Junio', value: 6 },
        { label: 'Julio', value: 7 },
        { label: 'Agosto', value: 8 },
        { label: 'Septiembre', value: 9 },
        { label: 'Octubre', value: 10 },
        { label: 'Noviembre', value: 11 },
        { label: 'Diciembre', value: 12 }
    ];

    const opcionesAnios = [
        { label: '2020', value: 2020 },
        { label: '2021', value: 2021 },
        { label: '2022', value: 2022 },
        { label: '2023', value: 2023 },
        { label: '2024', value: 2024 },
        // Agrega más años según necesites
    ];

    const clearFilter = () => {
        setGlobalFilter('');
        setMesSeleccionado(null);
        setAnioSeleccionado(null);

        if (dataTableRef.current) {
            dataTableRef.current.reset();
        }
    };

    const prepararExportacion = () => {
        if (toast.current) {
            toast.current.show({
                severity: 'info',
                summary: 'Exportación a Excel',
                detail: '¿Deseas exportar las cuotas filtradas a Excel?',
                life: 6000,
                content: (
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
            const datosParaExportar = filtrarCuotas().map(cuota => ({
                'Número Único': cuota.numero_unico,
                'Número de Documento': cuota.compraData.DCTO_N,
                'RUC': cuota.proveedorData.ruc,
                'Razón Social': cuota.proveedorData.razon_social,
                'Moneda': cuota.compraData.MONEDA,
                'Importe de la Cuota': cuota.importe_cuota,
                'Importe Total': cuota.compraData.IMPORTE,
                'Importe Restante': cuota.importeRestante,
                'Fecha de Emisión': cuota.fecha_emision,
                'Plazo (días)': cuota.plazo,
                'Fecha de Vencimiento': cuota.fecha_vencimiento,
                'Fecha de Pago': cuota.fecha_pago,
                'Observación': cuota.observacion
            }));

            const worksheet = XLSX.utils.json_to_sheet(datosParaExportar);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Cuotas');
            XLSX.writeFile(workbook, `Cuotas_${new Date().toLocaleDateString()}.xlsx`);

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

    const filtrarCuotas = () => {
        return cuotas.filter(cuota => {
            const fechaEmision = new Date(cuota.fecha_emision);

            let cumpleFiltroMes = mesSeleccionado ? (fechaEmision.getMonth() + 1 === mesSeleccionado) : true;
            let cumpleFiltroAnio = anioSeleccionado ? (fechaEmision.getFullYear() === anioSeleccionado) : true;

            return cumpleFiltroMes && cumpleFiltroAnio;
        });
    };

    const renderHeader = () => {
        return (
            <div className="table-header p-d-flex p-jc-between p-ai-center p-p-2">
                <Button
                    type="button"
                    icon="pi pi-refresh"
                    className="p-button-outlined p-mr-2"
                    onClick={fetchData}
                />
                <Button
                    type="button"
                    icon="pi pi-file-excel"
                    className="p-button-outlined p-mr-2"
                    onClick={prepararExportacion}
                    label="Exportar"
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
                        onChange={(e) => setGlobalFilter(e.target.value)}
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

    return (
        <div className="ventas-list-container">
            <Toast ref={toast} onRemove={() => setToastActivo(false)} />
            <div className="card">
                <h1>Listado de Cuotas</h1>
                <DataTable 
                    ref={dataTableRef} 
                    value={filtrarCuotas()} 
                    responsiveLayout="scroll" 
                    className="card" 
                    globalFilter={globalFilter} 
                    header={renderHeader()}
                >
                    <Column field="numero_unico" header="Número Único" filter filterPlaceholder="Buscar por número único" />
                    <Column field="compraData.DCTO_N" header="Número de Documento"
                        filter filterPlaceholder="Buscar por número de documento"
                        filterMatchMode="contains"
                        filterFunction={(value, filter) => value.toString().toLowerCase().includes(filter.toLowerCase())} />
                    <Column field="proveedorData.ruc" header="RUC"
                        filter filterPlaceholder="Buscar por RUC"
                        filterMatchMode="contains"
                        filterFunction={(value, filter) => value.toString().toLowerCase().includes(filter.toLowerCase())} />
                    <Column field="proveedorData.razon_social" header="Razón Social"
                        filter filterPlaceholder="Buscar por razón social"
                        filterMatchMode="contains"
                        filterFunction={(value, filter) => value.toLowerCase().includes(filter.toLowerCase())} />
                    <Column field="compraData.MONEDA" header="Moneda"
                        filter filterElement={monedaFilterTemplate} />
                    <Column field="importe_cuota" header="Importe de la Cuota" sortable />
                    <Column field="compraData.IMPORTE" header="Importe Total" sortable></Column>
                    <Column field="importeRestante" header="Importe Restante" sortable></Column>
                    <Column field="fecha_emision" header="Fecha de Emisión" body={(rowData) => formatoFecha(rowData.fecha_emision)}></Column>
                    <Column field="plazo" header="Plazo (días)"></Column>
                    <Column field="fecha_vencimiento" header="Fecha de Vencimiento" body={(rowData) => formatoFecha(rowData.fecha_vencimiento)}></Column>
                    <Column field="fecha_pago" header="Fecha de Pago" body={(rowData) => formatoFecha(rowData.fecha_pago)}></Column>
                    <Column field="observacion" header="Observación"></Column>
                </DataTable>
            </div>
        </div>
    );
}

export default CuotaCompra;
