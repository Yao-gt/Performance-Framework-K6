# Performance Framework K6 🚀

This repository contains a Performance Testing Framework (Phase 1) using **k6** and a demo application ([https://github.com/GoogleCloudPlatform/microservices-demo]). It is designed to evaluate the scalability, stability, and limits of microservices, integrating a comprehensive observability ecosystem for in-depth analysis of both hardware and the application.

---

## 🏗️ Observability Architecture

The framework uses a three-tier monitoring hierarchy to ensure that test results are accurate and actionable:

1.  **Application Layer (k6):** Measures response times (p95, p99), transactions per second (TPS), and error rates.
2.  **Container Layer (cAdvisor - Coming Soon):** Monitors CPU and RAM usage specific to each microservice in the Online Boutique.
3.  **Infrastructure Layer (Node Exporter):** Extracts metrics from the host (PC/WSL2) to ensure that hardware is not the bottleneck.

---

## 🛠️ Technology Stack

*   **Load Balancer:** [k6](https://k6.io/)
*   **Database (TSDB):** InfluxDB (for k6 metric history) and Prometheus (for system metrics).
*   **Visualization:** Grafana (interactive dashboards).
*   **Monitoring Agents:** Node Exporter (hardware/OS metrics).
*   **CI/CD:** GitHub Actions.

---

## Requirements

- IDE (Visual Studio Code)
- Docker Desktop
- Docker Compose
- k6

## Folder Structure

```
my-project/
├── .github/
│   └── workflows/
│      └── deployment.yml
├── docker/
│   └── docker-compose.yml
│   └── prometheus.yml
├── reports/
│   └── *.html
├── src/
│   └── config/
│   └── data/
│   └── scripts/
│      └── api/
│      └── browser/
│      └── hybrid/
```

## Steps

1. Start the infrastructure using Docker Compose in the Docker Desktop console:  
   ```bash
   docker compose up -d influxdb cadvisor prometheus grafana
   ```
    - `-d` runs the process in the background so you can continue working in the terminal while everything runs in the background.
2. In the project folder, run the test on src/scripts/api/ (for example) using the following command:
   ```bash
   k6 run --out influxdb=http://localhost:8086 src/scripts/api/test.js
   ```
3. After running the test on the docker console, you will see a new file in the reports folder which contains the metrics related to the test in a html format.
4. You can create your own dashboards in Grafana (http://localhost:3000/dashboards) using metrics from datasources like Prometheus and Influxdb


## Links to local environment

- Online Boutique: http://localhost:8080
- InfluxDB: http://localhost:8086
- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090
- Node Exporter: http://localhost:9100

## Examples of Grafana dashboards

1. k6 metris in Influxdb : https://grafana.com/grafana/dashboards/10660-k6-load-testing-results/
![k6 Dashboard](https://github.com/user-attachments/assets/0986d290-d4b3-4f42-b22b-17ddfd6511e0)
2. Node Exporter metrics in Prometheus: https://grafana.com/grafana/dashboards/1860-node-exporter-full/
![Node Exporter Dashboard](https://github.com/user-attachments/assets/3a967da7-0a08-4f0d-a32e-c7f22faa995e)

## Appendices

### prometheus.yml

```yaml
global:
  scrape_interval: 5s

scrape_configs:
  - job_name: 'node-metrics'
    static_configs:
      - targets: ['node-exporter-perf:9100']

  - job_name: 'influxdb-metrics'
    static_configs:
      - targets: ['influxdb-perf:8086']
```

---

### docker-compose.yml

```yaml

version: '3.8'

services:
  # Testing APP (microservices-demo - Online Boutique)
  online-boutique:
    image: gcr.io/google-samples/microservices-demo/frontend:v0.3.5
    container_name: shop-frontend
    ports:
      - 8080:8080
    environment:
      - PORT=8080
      - PRODUCT_CATALOG_SERVICE_ADDR=productcatalogservice:3550
      - CURRENCY_SERVICE_ADDR=currencyservice:7000
      - CART_SERVICE_ADDR=cartservice:7070
      - RECOMMENDATION_SERVICE_ADDR=recommendationservice:8080
      - SHIPPING_SERVICE_ADDR=shippingservice:50051
      - CHECKOUT_SERVICE_ADDR=checkoutservice:5050
      - AD_SERVICE_ADDR=adservice:9555
    networks:
      - perf-network
    depends_on:
      - currencyservice
      - productcatalogservice

  # Currency Service
  currencyservice:
    image: gcr.io/google-samples/microservices-demo/currencyservice:v0.3.5
    container_name: currency-service
    environment:
      - PORT=7000
      - DISABLE_PROFILER=1
      - DISABLE_TRACING=1
      - DISABLE_DEBUGGER=1
    networks:
      - perf-network

  # Product Catalog Service
  productcatalogservice:
    image: gcr.io/google-samples/microservices-demo/productcatalogservice:v0.3.5
    container_name: product-catalog-service
    networks:
      - perf-network

  # Cart Service
  cartservice:
    image: gcr.io/google-samples/microservices-demo/cartservice:v0.3.5
    container_name: cart-service
    environment:
      - PORT=7070
      - REDIS_ADDR=redis-cart:6379
    networks:
      - perf-network
    depends_on:
      - redis-cart

  # Cart Service need Redis
  redis-cart:
    image: redis:alpine
    container_name: redis-cart
    networks:
      - perf-network

  # Shipping Service
  shippingservice:
    image: us-central1-docker.pkg.dev/google-samples/microservices-demo/shippingservice:v0.10.1
    container_name: shipping-service
    environment:
      - PORT=50051
      - DISABLE_TRACING=1
      - DISABLE_PROFILER=1
    networks: 
      - perf-network

  # Checkout Service
  checkoutservice:
    image: us-central1-docker.pkg.dev/google-samples/microservices-demo/checkoutservice:v0.10.1
    container_name: checkout-service
    environment:
      - PORT=5050
      - PRODUCT_CATALOG_SERVICE_ADDR=productcatalogservice:3550
      - CURRENCY_SERVICE_ADDR=currencyservice:7000
      - CART_SERVICE_ADDR=cartservice:7070
      - SHIPPING_SERVICE_ADDR=shippingservice:50051
      - PAYMENT_SERVICE_ADDR=paymentservice:50051
      - EMAIL_SERVICE_ADDR=emailservice:5000
    networks: 
      - perf-network

  # Payment Service
  paymentservice:
    image: us-central1-docker.pkg.dev/google-samples/microservices-demo/paymentservice:v0.10.1
    container_name: payment-service
    environment:
      - PORT=50051
      - DISABLE_TRACING=1
      - DISABLE_PROFILER=1
    networks: 
      - perf-network

  # Email Service
  emailservice:
    image: us-central1-docker.pkg.dev/google-samples/microservices-demo/emailservice:v0.10.1
    container_name: email-service
    environment:
      - PORT=5000
      - DISABLE_TRACING=1
      - DISABLE_PROFILER=1
    networks: 
      - perf-network

  # Recommendation Service
  recommendationservice:
    image: us-central1-docker.pkg.dev/google-samples/microservices-demo/recommendationservice:v0.10.1
    container_name: recommendation-service
    environment:
      - PORT=8080
      - PRODUCT_CATALOG_SERVICE_ADDR=productcatalogservice:3550
      - DISABLE_TRACING=1
      - DISABLE_PROFILER=1
    networks:
      - perf-network

  adservice:
    image: gcr.io/google-samples/microservices-demo/adservice:v0.3.5
    container_name: ad-service
    environment:
      - PORT=9555
    networks:
      - perf-network
  

  # Database (InfluxDB)
  influxdb:
    image: influxdb:1.8
    container_name: influxdb-perf
    ports:
      - 8086:8086
    environment:
      - INFLUXDB_DB=k6
      - INFLUXDB_HTTP_BIND_ADDRESS=:8086
    networks:
      - perf-network
    volumes:
      - influxdb-data:/var/lib/influxdb

  # Data Visualization (Grafana)
  grafana:
    image: grafana/grafana:latest
    container_name: grafana-perf
    ports:
      - 3000:3000
    depends_on:
      - influxdb
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_AUTH_ANONYMOUS_ENABLED=true
    networks:
      - perf-network
    volumes:
      - grafana-data:/var/lib/grafana
  
  # System Metrics Collection (Prometheus)
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus-perf
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
    networks:
      - perf-network

  # Hardware Metrics Exporter (Node Exporter)
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter-perf
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($|/)'
    ports:
      - "9100:9100"
    networks:
      - perf-network

networks:
  perf-network:
    driver: bridge

volumes:
  influxdb-data:
  grafana-data:

```
