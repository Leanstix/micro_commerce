FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

ENV DJANGO_SETTINGS_MODULE=microcommerce.settings
CMD ["bash", "-lc", "python manage.py migrate && gunicorn microcommerce.wsgi:application --bind 0.0.0.0:8000"]
