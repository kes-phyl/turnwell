import './layout.js';
import { bindForm } from './form-submit.js';

const form = document.querySelector('[data-enquiry-form]');
if (form) bindForm(form);
