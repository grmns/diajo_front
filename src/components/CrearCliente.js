import React, { useState, useEffect, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { AutoComplete } from 'primereact/autocomplete';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { InputTextarea } from 'primereact/inputtextarea';
import axios from 'axios';
import '../styles/formcliente.css';

function CrearCliente() {
    const [cliente, setCliente] = useState({
        RUC: '',
        RAZON_SOCIAL: '',
        TIPO_CLIENTE: null,
        GRUPO_ECON: '',
        NOMBRE_GRUPO: '',
        VENDEDOR: null,
        razones_sociales_anteriores: ''
    });
    const [vendedores, setVendedores] = useState([]);
    const [filteredVendedores, setFilteredVendedores] = useState([]);
    const toast = useRef(null);

    useEffect(() => {
        // Suponiendo que necesites cargar información adicional como tipos de cliente
        axios.get('http://127.0.0.1:8000/api/vendedores/')
            .then(res => {
                const vendedoresData = res.data.map(vendedor => ({
                    label: `${vendedor.NOMBRE} (${vendedor.CODIGO})`,
                    value: vendedor.ID_VENDEDOR
                }));
                setVendedores(vendedoresData);
            })
            .catch(error => console.error('Error al cargar vendedores:', error));
    }, []);

    const handleChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _cliente = { ...cliente };
        _cliente[`${name}`] = val;

        setCliente(_cliente);
    };

    const searchVendedor = (event) => {
        setTimeout(() => {
            let _filteredVendedores;
            if (!event.query.trim().length) {
                _filteredVendedores = [...vendedores];
            } else {
                _filteredVendedores = vendedores.filter((vendedor) => {
                    return vendedor.label.toLowerCase().includes(event.query.toLowerCase());
                });
            }
            setFilteredVendedores(_filteredVendedores);
        }, 250);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            ...cliente,
            VENDEDOR: cliente.VENDEDOR ? cliente.VENDEDOR.value : null  // Asegurándonos de enviar solo el ID del vendedor
        };

        console.log('Datos a enviar:', payload);  // Para verificar que se está enviando el formato correcto

        axios.post('http://127.0.0.1:8000/api/clientes/', payload)
            .then(response => {
                toast.current.show({ severity: 'success', summary: 'Cliente creado', detail: 'El cliente ha sido creado exitosamente.', life: 3000 });
                setCliente({
                    RUC: '',
                    RAZON_SOCIAL: '',
                    TIPO_CLIENTE: null,
                    GRUPO_ECON: '',
                    NOMBRE_GRUPO: '',
                    VENDEDOR: null,
                    razones_sociales_anteriores: ''
                });
            })
            .catch(error => {
                console.error('Error al crear cliente:', error.response ? error.response.data : error);
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el cliente.', life: 3000 });
            });
    };



    return (
        <div className="formulario-crear-cliente">
            <Toast ref={toast} />
            <h2 className="titulo-formulario">Crear Cliente</h2>
            <form onSubmit={handleSubmit} className="form-cliente">
                <div className="p-fluid grid">
                    <div className="form-group">
                        <label htmlFor="ruc" className="form-label">RUC:</label>
                        <InputText id="ruc" value={cliente.RUC} onChange={(e) => handleChange(e, 'RUC')} className="p-inputtext" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="razon_social" className="form-label">Razón Social:</label>
                        <InputText id="razon_social" value={cliente.RAZON_SOCIAL} onChange={(e) => handleChange(e, 'RAZON_SOCIAL')} className="p-inputtext" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="tipo_cliente" className="form-label">Tipo Cliente:</label>
                        <Dropdown id="tipo_cliente" value={cliente.TIPO_CLIENTE} onChange={(e) => handleChange(e, 'TIPO_CLIENTE')}
                            options={[{ label: 'Tipo 1', value: 1 }, { label: 'Tipo 2', value: 2 }]}  // Ajusta estas opciones según tu modelo
                            placeholder="Selecciona tipo de cliente" className="p-dropdown" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="grupo_econ" className="form-label">Grupo Económico:</label>
                        <InputText id="grupo_econ" value={cliente.GRUPO_ECON} onChange={(e) => handleChange(e, 'GRUPO_ECON')} className="p-inputtext" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="nombre_grupo" className="form-label">Nombre Grupo:</label>
                        <InputText id="nombre_grupo" value={cliente.NOMBRE_GRUPO} onChange={(e) => handleChange(e, 'NOMBRE_GRUPO')} className="p-inputtext" />
                    </div>
                    {/* <div className="form-group">
                        <label htmlFor="razones_sociales_anteriores" className="form-label">Razones Sociales Anteriores</label>
                        <InputTextarea id="razones_sociales_anteriores" value={cliente.razones_sociales_anteriores} onChange={(e) => handleChange(e, 'razones_sociales_anteriores')} rows={3} className="p-inputtextarea" />
                    </div> */}
                    <div className="form-group">
                        <label htmlFor="vendedor" className="form-label">Vendedor:</label>
                        <AutoComplete 
                            value={cliente.VENDEDOR} 
                            suggestions={filteredVendedores} 
                            completeMethod={searchVendedor} 
                            field="label"
                            forceSelection 
                            itemTemplate={(item) => item.label}
                            onChange={(e) => setCliente({ ...cliente, VENDEDOR: e.value })}
                            placeholder="Selecciona un vendedor" className="p-autocomplete" />
                    </div>
                    <Button type="submit" label="Crear Cliente" className="p-button p-button-success" />
                </div>
            </form>
        </div>
    );


}

export default CrearCliente;
