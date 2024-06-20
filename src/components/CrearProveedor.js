import React, { useState, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import axiosInstance from './axios';  // Asegúrate de que este path sea correcto
import '../styles/formproveedor.css';  // Asegúrate de que el estilo CSS exista y esté correctamente vinculado

function CrearProveedor() {
    const [proveedor, setProveedor] = useState({
        ruc: '',
        razon_social: ''
    });
    const toast = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProveedor(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        axiosInstance.post('http://127.0.0.1:8000/compras/api/proveedores/', proveedor)
            .then(response => {
                toast.current.show({ severity: 'success', summary: 'Proveedor Creado', detail: 'El proveedor ha sido creado exitosamente.', life: 3000 });
                // Puedes limpiar el formulario aquí o redirigir al usuario
                setProveedor({ ruc: '', razon_social: '' });
            })
            .catch(error => {
                console.error('Error al crear el proveedor:', error);
                toast.current.show({ severity: 'error', summary: 'Error al crear', detail: 'No se pudo crear el proveedor.', life: 3000 });
            });
    };

    return (
        <div className="formulario-crear-proveedor">
            <Toast ref={toast} />
            <h2>Crear Nuevo Proveedor</h2>
            <form onSubmit={handleSubmit} className="form-proveedor">
                <div className="form-group">
                    <label htmlFor="ruc" className="form-label">RUC:</label>
                    <InputText id="ruc" value={proveedor.ruc} onChange={handleChange} name="ruc" placeholder="Ingrese RUC" />
                </div>
                <div className="form-group">
                    <label htmlFor="razon_social" className="form-label">Razón Social:</label>
                    <InputText id="razon_social" value={proveedor.razon_social} onChange={handleChange} name="razon_social" placeholder="Ingrese razón social" />
                </div>
                <Button type="submit" label="Crear Proveedor" className="p-button-success" />
            </form>
        </div>
    );
}

export default CrearProveedor;
