// Contact form handling with jQuery
$(document).ready(function () {
    const $form = $('#contactForm');
    const $feedback = $('#formFeedback');
    const $submitBtn = $form.find('button[type="submit"]');
    const originalBtnText = $submitBtn.text();

    $form.on('submit', function (e) {
        e.preventDefault();

        // Reset previous state
        $feedback.removeClass('feedback-success feedback-error').text('');
        $('.form-input, .form-textarea').removeClass('input-error');
        $form.addClass('submitting');
        $submitBtn.text('Enviando...');

        $.ajax({
            url: '/contact',
            type: 'POST',
            data: $form.serialize(),
            success: function (response) {
                $form.removeClass('submitting');
                $submitBtn.text(originalBtnText);

                if (response.status === 'success') {
                    $feedback.addClass('feedback-success').text(response.message);
                    $form[0].reset();
                } else {
                    // This block might catch custom error status 200 responses if backend logic changes,
                    // but usually errors come as 400+
                    $feedback.addClass('feedback-error').text(response.message || 'Hubo un error al enviar el mensaje.');
                }
            },
            error: function (xhr) {
                $form.removeClass('submitting');
                $submitBtn.text(originalBtnText);

                let errorMessage = 'Hubo un error al conectar con el servidor.';

                if (xhr.responseJSON) {
                    if (xhr.responseJSON.errors) {
                        // Handle validation errors
                        const errors = xhr.responseJSON.errors;
                        let firstError = '';

                        for (const field in errors) {
                            $(`[name="${field}"]`).addClass('input-error');
                            if (!firstError) firstError = errors[field][0];
                        }
                        errorMessage = firstError || 'Por favor revisa los campos marcados.';
                    } else if (xhr.responseJSON.message) {
                        errorMessage = xhr.responseJSON.message;
                    }
                }

                $feedback.addClass('feedback-error').text(errorMessage);
            }
        });
    });

    // Clear error style on input
    $('.form-input, .form-textarea').on('input', function () {
        $(this).removeClass('input-error');
    });
});
